import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { EnquiryRepository } from '../repositories/enquiryRepository';
import { MailRepository } from '../repositories/mailRepository';
import { AuditRepository } from '../repositories/auditRepository';
import { UserRole } from '@postmate/shared';

export class EnquiryController {
  static async search(req: AuthenticatedRequest, res: Response) {
    try {
      const { trackingNumber } = req.query;
      if (!trackingNumber) {
        return res.status(400).json({ success: false, message: 'Tracking number is required.' });
      }

      const cleanCode = (trackingNumber as string).trim().toUpperCase();
      const mail = await MailRepository.findByTrackingNumber(cleanCode);
      const enquiries = await EnquiryRepository.findByTrackingNumber(cleanCode);

      if (!mail) {
        return res.json({
          success: true,
          found: false,
          trackingNumber: cleanCode,
          message: 'No postal record found matching this tracking reference.',
          enquiryHistory: enquiries
        });
      }

      // Privacy Masking for public/general roles
      const isPrivileged = req.user?.role === UserRole.POSTMASTER || req.user?.role === UserRole.ADMIN;
      const maskedRecipient = isPrivileged
        ? mail.recipientName
        : mail.recipientName.slice(0, 2) + '**** ' + mail.recipientName.slice(-2);
      const maskedPhone = isPrivileged
        ? mail.recipientPhone
        : mail.recipientPhone ? mail.recipientPhone.slice(0, 3) + '****' + mail.recipientPhone.slice(-2) : undefined;

      return res.json({
        success: true,
        found: true,
        record: {
          id: mail.id,
          trackingNumber: mail.trackingNumber,
          category: mail.category,
          currentStatus: mail.currentStatus,
          originOffice: mail.originOffice,
          originPincode: mail.originPincode,
          destinationOffice: mail.destinationOffice,
          destinationPincode: mail.destinationPincode,
          receivedDate: mail.receivedDate,
          recipientName: maskedRecipient,
          recipientPhone: maskedPhone,
          deliveryAttemptCount: mail.deliveryAttemptCount,
          lastAttemptDate: mail.lastDeliveryAttemptDate,
          deliveryExceptionReason: mail.deliveryExceptionReason,
          statusHistory: mail.statusHistory
        },
        enquiryHistory: enquiries
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  static async list(req: AuthenticatedRequest, res: Response) {
    try {
      const enquiries = await EnquiryRepository.getAll(req.user?.officeId);
      return res.json({ success: true, enquiries });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  static async create(req: AuthenticatedRequest, res: Response) {
    try {
      const { trackingNumber, customerName, customerPhone, customerEmail, enquiryType, subject, description, followUpDate } = req.body;

      if (!trackingNumber || !customerName || !subject) {
        return res.status(400).json({ success: false, message: 'Tracking number, customer name and subject are required.' });
      }

      const mail = await MailRepository.findByTrackingNumber(trackingNumber.trim().toUpperCase());

      const enquiry = await EnquiryRepository.create({
        trackingNumber: trackingNumber.trim().toUpperCase(),
        customerName,
        customerPhone,
        customerEmail,
        enquiryType: enquiryType || 'STATUS_CHECK',
        subject,
        description: description || '',
        followUpDate,
        recordedBy: req.user!.id,
        recordedByName: req.user!.name,
        statusAtEnquiryTime: mail?.currentStatus,
        mailCategory: mail?.category,
        officeId: req.user?.officeId
      });

      await AuditRepository.log({
        userId: req.user!.id,
        userName: req.user!.name,
        userRole: req.user!.role,
        action: 'ENQUIRY_LOGGED',
        module: 'ENQUIRY',
        entityId: enquiry.id,
        details: `Customer enquiry ${enquiry.enquiryNumber} logged for ${trackingNumber} by ${customerName}`,
        officeId: req.user?.officeId
      });

      return res.status(201).json({ success: true, enquiry });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  static async updateResolution(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const { resolutionStatus, resolutionNotes } = req.body;

      const updated = await EnquiryRepository.update(id, {
        resolutionStatus,
        resolutionNotes
      });

      if (!updated) {
        return res.status(404).json({ success: false, message: 'Enquiry not found.' });
      }

      return res.json({ success: true, enquiry: updated });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }
}
