import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { MailRepository } from '../repositories/mailRepository';
import { DeliveryRepository } from '../repositories/deliveryRepository';
import { CashbookRepository } from '../repositories/cashbookRepository';
import { UserRepository } from '../repositories/userRepository';
import { MailDirection, MailStatus, MailCategory } from '@postmate/shared';

export class AnalyticsController {
  static async getDashboardMetrics(req: AuthenticatedRequest, res: Response) {
    try {
      const officeId = req.user?.officeId || 'PO-600001';
      const office = await UserRepository.getOffice(officeId);
      const { items: allMail } = await MailRepository.filter({ officeId, limit: 5000 });
      const deliverySummary = await DeliveryRepository.getSummary(officeId);
      const cashBalance = await CashbookRepository.recalculateDailyBalance(officeId, new Date().toISOString().slice(0, 10));

      const incomingCount = allMail.filter(m => m.direction === MailDirection.INCOMING).length;
      const outgoingCount = allMail.filter(m => m.direction === MailDirection.OUTGOING).length;
      const pendingCount = allMail.filter(m => m.currentStatus !== MailStatus.DELIVERED && m.currentStatus !== MailStatus.DISPATCHED).length;
      const deliveredCount = allMail.filter(m => m.currentStatus === MailStatus.DELIVERED).length;
      const exceptionCount = allMail.filter(m => m.currentStatus === MailStatus.EXCEPTION).length;

      // Bottleneck Detection
      const bottlenecks: string[] = [];
      const unassignedScanned = allMail.filter(m => m.currentStatus === MailStatus.SCANNED).length;
      if (unassignedScanned > 5) {
        bottlenecks.push(`${unassignedScanned} mail items scanned but pending sorting or delivery assignment`);
      }
      if (cashBalance.reconciliationStatus === 'PENDING') {
        bottlenecks.push('Daily cashbook physical chest count reconciliation pending');
      }
      if (deliverySummary.exceptions > 0) {
        bottlenecks.push(`${deliverySummary.exceptions} active delivery exceptions requiring follow-up/reattempt`);
      }

      // Volume by category
      const categoryVolume = {
        [MailCategory.SPEED_POST]: allMail.filter(m => m.category === MailCategory.SPEED_POST).length,
        [MailCategory.REGISTERED_POST]: allMail.filter(m => m.category === MailCategory.REGISTERED_POST).length,
        [MailCategory.PARCEL]: allMail.filter(m => m.category === MailCategory.PARCEL).length,
        [MailCategory.ORDINARY_LETTER]: allMail.filter(m => m.category === MailCategory.ORDINARY_LETTER).length,
        [MailCategory.BOOK_POST]: allMail.filter(m => m.category === MailCategory.BOOK_POST).length,
        [MailCategory.MONEY_ORDER]: allMail.filter(m => m.category === MailCategory.MONEY_ORDER).length
      };

      // Past 7 Days Trends strictly from verified database records (no fabricated counts)
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const past7Days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        const dateStr = d.toISOString().slice(0, 10);
        const dayMail = allMail.filter(m => m.receivedDate.slice(0, 10) === dateStr);
        const dayDelivered = allMail.filter(
          m => m.currentStatus === MailStatus.DELIVERED && (m.deliveredTimestamp || m.updatedAt).slice(0, 10) === dateStr
        );
        return {
          day: days[d.getDay()],
          date: dateStr,
          incoming: dayMail.filter(m => m.direction === MailDirection.INCOMING).length,
          outgoing: dayMail.filter(m => m.direction === MailDirection.OUTGOING).length,
          delivered: dayDelivered.length
        };
      });

      const hasTrendData = past7Days.some(d => d.incoming > 0 || d.outgoing > 0 || d.delivered > 0);

      // Staff workload summary from actual records
      const staffList = await UserRepository.getAllStaff(officeId);
      const staffWorkload = staffList.map(staff => {
        const assigned = allMail.filter(m => m.assignedStaffId === staff.id);
        const completed = assigned.filter(m => m.currentStatus === MailStatus.DELIVERED).length;
        const pending = assigned.filter(m => m.currentStatus !== MailStatus.DELIVERED && m.currentStatus !== MailStatus.RETURNED_TO_SENDER).length;
        return {
          id: staff.id,
          name: staff.name,
          role: staff.role,
          assigned: assigned.length,
          completed,
          pending
        };
      });

      return res.json({
        success: true,
        office: office || {
          id: officeId,
          code: 'PO-600001',
          name: req.user?.officeName || 'Anna Nagar Sub Post Office',
          type: 'Town'
        },
        counts: {
          incomingCount,
          outgoingCount,
          pendingCount,
          deliveredCount,
          exceptionCount,
          totalCount: allMail.length
        },
        delivery: deliverySummary,
        cash: cashBalance,
        bottlenecks,
        categoryVolume,
        trends: past7Days,
        hasTrendData,
        staffWorkload
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }
}
