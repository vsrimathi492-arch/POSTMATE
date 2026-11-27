import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { UserRepository } from '../repositories/userRepository';
import { MailRepository } from '../repositories/mailRepository';
import { DeliveryRepository } from '../repositories/deliveryRepository';
import { NotificationRepository } from '../repositories/notificationRepository';
import { MailStatus } from '@postmate/shared';
import { AuditRepository } from '../repositories/auditRepository';

export class StaffController {
  static async list(req: AuthenticatedRequest, res: Response) {
    try {
      const officeId = req.user?.officeId;
      const staffList = await UserRepository.getAllStaff(officeId);
      const { items: allMail } = await MailRepository.filter({ officeId, limit: 2000 });

      const workloadSummary = staffList.map(staff => {
        const staffMail = allMail.filter(m => m.assignedStaffId === staff.id);
        const assignedCount = staffMail.length;
        const completedCount = staffMail.filter(m => m.currentStatus === MailStatus.DELIVERED).length;
        const pendingCount = staffMail.filter(m => m.currentStatus !== MailStatus.DELIVERED && m.currentStatus !== MailStatus.RETURNED_TO_SENDER).length;

        return {
          ...staff,
          assignedCount,
          completedCount,
          pendingCount,
          completionRate: assignedCount > 0 ? Math.round((completedCount / assignedCount) * 100) : 0,
          workloadStatus: pendingCount > 15 ? 'HIGH' : pendingCount > 8 ? 'BALANCED' : 'LIGHT'
        };
      });

      return res.json({ success: true, staff: workloadSummary });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getWorkloadSuggestions(req: AuthenticatedRequest, res: Response) {
    try {
      const officeId = req.user?.officeId;
      const staffList = await UserRepository.getAllStaff(officeId);
      const { items: allMail } = await MailRepository.filter({ officeId, limit: 2000 });

      const metrics = staffList.map(staff => {
        const staffMail = allMail.filter(m => m.assignedStaffId === staff.id);
        const pendingCount = staffMail.filter(m => m.currentStatus !== MailStatus.DELIVERED).length;
        return {
          id: staff.id,
          name: staff.name,
          employeeId: staff.employeeId,
          pendingCount,
          isAvailable: staff.isActive
        };
      });

      const overloaded = metrics.filter(m => m.pendingCount > 12);
      const underloaded = metrics.filter(m => m.pendingCount < 6 && m.isAvailable);

      return res.json({
        success: true,
        metrics,
        balancingSuggestions: overloaded.map(o => ({
          overloadedStaffId: o.id,
          overloadedStaff: o.name,
          overloadCount: o.pendingCount,
          recommendedReassignees: underloaded.map(u => ({
            id: u.id,
            name: u.name,
            currentPending: u.pendingCount
          }))
        }))
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  static async reassignTasks(req: AuthenticatedRequest, res: Response) {
    try {
      const { fromStaffId, toStaffId, count = 2 } = req.body;
      if (!fromStaffId || !toStaffId || fromStaffId === toStaffId) {
        return res.status(400).json({ success: false, message: 'Valid source and target staff members are required.' });
      }

      const targetStaff = await UserRepository.findById(toStaffId);
      const sourceStaff = await UserRepository.findById(fromStaffId);
      if (!targetStaff || !sourceStaff) {
        return res.status(404).json({ success: false, message: 'Staff member not found.' });
      }

      const { items: staffMail } = await MailRepository.filter({
        officeId: req.user?.officeId,
        assignedStaffId: fromStaffId,
        limit: 500
      });

      const pendingItems = staffMail
        .filter(m => m.currentStatus === MailStatus.OUT_FOR_DELIVERY || m.currentStatus === MailStatus.ASSIGNED || m.currentStatus === MailStatus.EXCEPTION)
        .slice(0, Math.max(1, Number(count)));

      if (pendingItems.length === 0) {
        return res.status(400).json({ success: false, message: 'No pending tasks available to reassign.' });
      }

      for (const mail of pendingItems) {
        await MailRepository.update(mail.id, {
          assignedStaffId: targetStaff.id,
          assignedStaffName: targetStaff.name,
          assignedStaffEmployeeId: targetStaff.employeeId
        });
        await MailRepository.addStatusHistory(mail.id, {
          status: mail.currentStatus,
          timestamp: new Date().toISOString(),
          updatedBy: req.user!.id,
          updatedByName: req.user!.name,
          notes: `Workload reassigned from ${sourceStaff.name} to ${targetStaff.name} by ${req.user!.name}`
        });

        const assignment = await DeliveryRepository.findByMailId(mail.id);
        if (assignment) {
          await DeliveryRepository.update(assignment.id, {
            assignedStaffId: targetStaff.id,
            assignedStaffName: targetStaff.name,
            assignedStaffEmployeeId: targetStaff.employeeId
          });
        }
      }

      await AuditRepository.log({
        userId: req.user!.id,
        userName: req.user!.name,
        userRole: req.user!.role,
        action: 'WORKLOAD_REASSIGNED',
        module: 'STAFF',
        entityId: toStaffId,
        details: `Authorized reassignment of ${pendingItems.length} pending deliveries from ${sourceStaff.name} to ${targetStaff.name}`,
        officeId: req.user?.officeId
      });

      await NotificationRepository.create({
        title: `Workload Reassignment: ${pendingItems.length} Tasks`,
        titleTa: `பணி மறுஒதுக்கீடு: ${pendingItems.length} பணிகள்`,
        message: `${pendingItems.length} deliveries reassigned to you from ${sourceStaff.name}.`,
        messageTa: `${sourceStaff.name} இடமிருந்து ${pendingItems.length} விநியோக பணிகள் உங்களுக்கு மாற்றப்பட்டுள்ளன.`,
        type: 'INFO',
        category: 'DELIVERY',
        targetUserId: targetStaff.id,
        officeId: req.user?.officeId
      });

      return res.json({
        success: true,
        reassignedCount: pendingItems.length,
        message: `Successfully reassigned ${pendingItems.length} tasks to ${targetStaff.name}.`
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  static async toggleAvailability(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const { isActive } = req.body;
      const updated = await UserRepository.update(id, { isActive });
      if (!updated) {
        return res.status(404).json({ success: false, message: 'Staff member not found.' });
      }

      await AuditRepository.log({
        userId: req.user!.id,
        userName: req.user!.name,
        userRole: req.user!.role,
        action: 'STAFF_STATUS_UPDATED',
        module: 'STAFF',
        entityId: id,
        details: `Staff ${updated.name} availability toggled to ${isActive ? 'Active' : 'Inactive'}`,
        officeId: req.user?.officeId
      });

      return res.json({ success: true, staff: updated });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }
}
