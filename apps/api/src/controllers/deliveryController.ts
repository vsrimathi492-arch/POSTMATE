import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { DeliveryRepository } from '../repositories/deliveryRepository';
import { AutomationEngine } from '../services/automationEngine';
import { MailStatus, DeliveryExceptionReason } from '@postmate/shared';

export class DeliveryController {
  static async list(req: AuthenticatedRequest, res: Response) {
    try {
      const officeId = req.user?.officeId;
      const deliveries = await DeliveryRepository.getAll(officeId);
      return res.json({ success: true, deliveries });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getMyDeliveries(req: AuthenticatedRequest, res: Response) {
    try {
      const staffId = req.user!.id;
      const { status } = req.query;
      const deliveries = await DeliveryRepository.findByStaffId(
        staffId,
        status as MailStatus
      );
      return res.json({ success: true, deliveries });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  static async assign(req: AuthenticatedRequest, res: Response) {
    try {
      const { mailId, staffId } = req.body;
      if (!mailId || !staffId) {
        return res.status(400).json({ success: false, message: 'Mail ID and Staff ID are required.' });
      }

      const result = await AutomationEngine.assignDelivery(mailId, staffId, req.user!);
      return res.json({
        success: true,
        message: 'Delivery task assigned successfully and synchronized with central mail record.',
        ...result
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  static async updateStatus(req: AuthenticatedRequest, res: Response) {
    try {
      const { mailId } = req.params;
      const { status, deliveredTo, recipientRelationship, signatureDataUrl, exceptionReason, exceptionNotes, notes } = req.body;

      if (!status) {
        return res.status(400).json({ success: false, message: 'Delivery status is required.' });
      }

      if (status === MailStatus.EXCEPTION && !exceptionReason) {
        return res.status(400).json({
          success: false,
          message: 'An official exception reason is required when marking an exception.'
        });
      }

      const result = await AutomationEngine.updateDeliveryStatus(
        mailId,
        status,
        { deliveredTo, recipientRelationship, signatureDataUrl, exceptionReason, exceptionNotes, notes },
        req.user!
      );

      return res.json({
        success: true,
        message: `Delivery status updated to ${status} in central records.`,
        ...result
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getSummary(req: AuthenticatedRequest, res: Response) {
    try {
      const summary = await DeliveryRepository.getSummary(req.user?.officeId);
      return res.json({ success: true, summary });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }
}
