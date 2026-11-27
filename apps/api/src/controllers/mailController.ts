import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { MailRepository } from '../repositories/mailRepository';
import { AutomationEngine } from '../services/automationEngine';
import { AuditRepository } from '../repositories/auditRepository';
import { MailDirection, MailCategory, MailStatus } from '@postmate/shared';

export class MailController {
  static async list(req: AuthenticatedRequest, res: Response) {
    try {
      const { direction, category, status, search, startDate, endDate, page, limit } = req.query;
      const officeId = req.user?.officeId;

      const result = await MailRepository.filter({
        officeId,
        direction: direction as MailDirection,
        category: category as MailCategory,
        status: status as MailStatus,
        search: search as string,
        startDate: startDate as string,
        endDate: endDate as string,
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 50
      });

      return res.json({ success: true, ...result });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getById(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const mail = await MailRepository.findById(id);
      if (!mail) {
        return res.status(404).json({ success: false, message: 'Mail item not found.' });
      }
      return res.json({ success: true, mail });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getByTracking(req: AuthenticatedRequest, res: Response) {
    try {
      const { trackingNumber } = req.params;
      const mail = await MailRepository.findByTrackingNumber(trackingNumber);
      if (!mail) {
        return res.status(404).json({ success: false, message: 'Tracking record not found.' });
      }
      return res.json({ success: true, mail });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  static async create(req: AuthenticatedRequest, res: Response) {
    try {
      const dto = req.body;
      if (!dto.trackingNumber) {
        return res.status(400).json({ success: false, message: 'Tracking number is required.' });
      }

      const { mail, isDuplicate, duplicateRecord } = await AutomationEngine.processNewMailEntry(
        dto,
        req.user!
      );

      if (isDuplicate) {
        return res.status(409).json({
          success: false,
          isDuplicate: true,
          message: `Duplicate item detected! Mail with tracking number ${dto.trackingNumber} is already registered in the system.`,
          duplicateRecord
        });
      }

      return res.status(201).json({
        success: true,
        message: 'Mail item registered successfully into central records.',
        mail
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  static async update(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const {
        category,
        destinationOffice,
        destinationPincode,
        recipientName,
        recipientAddress,
        recipientPhone,
        sortingArea,
        notes
      } = req.body;

      const allowedUpdates: Record<string, any> = {};
      if (category !== undefined) allowedUpdates.category = category;
      if (destinationOffice !== undefined) allowedUpdates.destinationOffice = destinationOffice;
      if (destinationPincode !== undefined) allowedUpdates.destinationPincode = destinationPincode;
      if (recipientName !== undefined) allowedUpdates.recipientName = recipientName;
      if (recipientAddress !== undefined) allowedUpdates.recipientAddress = recipientAddress;
      if (recipientPhone !== undefined) allowedUpdates.recipientPhone = recipientPhone;
      if (sortingArea !== undefined) allowedUpdates.sortingArea = sortingArea;
      if (notes !== undefined) allowedUpdates.deliveryNotes = notes;

      const updated = await MailRepository.update(id, allowedUpdates);
      if (!updated) {
        return res.status(404).json({ success: false, message: 'Mail record not found.' });
      }

      await AuditRepository.log({
        userId: req.user!.id,
        userName: req.user!.name,
        userRole: req.user!.role,
        action: 'MAIL_RECORD_CORRECTED',
        module: 'MAIL',
        entityId: id,
        details: `Manual correction applied to ${updated.trackingNumber}: ${Object.keys(allowedUpdates).join(', ')}`,
        officeId: req.user?.officeId
      });

      return res.json({ success: true, mail: updated });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getSummary(req: AuthenticatedRequest, res: Response) {
    try {
      const summary = await MailRepository.getRegisterSummary(req.user?.officeId);
      return res.json({ success: true, summary });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }
}
