import { MailRepository } from '../repositories/mailRepository';
import { DeliveryRepository } from '../repositories/deliveryRepository';
import { SortingRepository } from '../repositories/sortingRepository';
import { CashbookRepository } from '../repositories/cashbookRepository';
import { ReportRepository } from '../repositories/reportRepository';
import { NotificationRepository } from '../repositories/notificationRepository';
import { AuditRepository } from '../repositories/auditRepository';
import { UserRepository } from '../repositories/userRepository';
import {
  IMailRecord,
  MailStatus,
  MailDirection,
  MailCategory,
  CreateMailDto,
  DeliveryExceptionReason,
  ReportType,
  DailyOperationsReport,
  IUser
} from '@postmate/shared';

export class AutomationEngine {
  /**
   * Core Engine Step 1: Mail Scanned or Entered Once
   * Automatically validates, checks duplicates, saves central record,
   * updates mail register counters, and makes it available for sorting and delivery.
   */
  static async processNewMailEntry(dto: CreateMailDto, actor: { id: string; name: string; role: string; officeId: string }): Promise<{ mail: IMailRecord; isDuplicate: boolean; duplicateRecord?: IMailRecord }> {
    const cleanTracking = dto.trackingNumber.trim().toUpperCase();

    // Duplicate Check
    const existing = await MailRepository.findByTrackingNumber(cleanTracking);
    if (existing && existing.currentStatus !== MailStatus.DELIVERED && existing.currentStatus !== MailStatus.RETURNED_TO_SENDER) {
      return {
        mail: existing,
        isDuplicate: true,
        duplicateRecord: existing
      };
    }

    const mail = await MailRepository.create({
      ...dto,
      trackingNumber: cleanTracking,
      officeId: actor.officeId,
      currentStatus: MailStatus.SCANNED,
      statusHistory: [
        {
          status: MailStatus.SCANNED,
          timestamp: new Date().toISOString(),
          updatedBy: actor.id,
          updatedByName: actor.name,
          notes: `Verified & Registered via ${dto.verificationSource || 'Smart Scanner'}`
        }
      ]
    });

    // Auto Audit Log
    await AuditRepository.log({
      userId: actor.id,
      userName: actor.name,
      userRole: actor.role,
      action: 'MAIL_REGISTERED',
      module: 'MAIL',
      entityId: mail.id,
      details: `New mail item ${mail.trackingNumber} (${mail.category}) registered. One-time data entry verified.`,
      officeId: actor.officeId
    });

    // Notify postmaster if high priority
    if (mail.category === MailCategory.SPEED_POST || mail.category === MailCategory.PARCEL) {
      await NotificationRepository.create({
        title: `New Priority Mail: ${mail.trackingNumber}`,
        titleTa: `புதிய அவசர அஞ்சல்: ${mail.trackingNumber}`,
        message: `${mail.category} received from ${mail.originOffice} addressed to ${mail.recipientName}. Ready for sorting.`,
        messageTa: `${mail.originOffice} இலிருந்து பெறப்பட்ட ${mail.category}. பிரித்தெடுப்பதற்கு தயார்.`,
        type: 'INFO',
        category: 'SORTING',
        relatedId: mail.id,
        targetRole: 'POSTMASTER',
        officeId: actor.officeId
      });
    }

    return { mail, isDuplicate: false };
  }

  /**
   * Core Engine Step 2: Smart Delivery Assignment
   * Updates central mail record, links delivery task, updates staff workload.
   */
  static async assignDelivery(
    mailId: string,
    staffId: string,
    actor: { id: string; name: string; role: string; officeId: string }
  ): Promise<any> {
    const mail = await MailRepository.findById(mailId);
    if (!mail) throw new Error(`Mail item not found: ${mailId}`);

    const staff = await UserRepository.findById(staffId);
    if (!staff) throw new Error(`Staff member not found: ${staffId}`);

    // Update central mail record
    const updatedMail = await MailRepository.addStatusHistory(mailId, {
      status: MailStatus.OUT_FOR_DELIVERY,
      timestamp: new Date().toISOString(),
      updatedBy: actor.id,
      updatedByName: actor.name,
      notes: `Assigned to delivery agent ${staff.name} (${staff.employeeId})`
    });

    await MailRepository.update(mailId, {
      assignedStaffId: staff.id,
      assignedStaffName: staff.name,
      assignedStaffEmployeeId: staff.employeeId,
      currentStatus: MailStatus.OUT_FOR_DELIVERY
    });

    // Create or update delivery assignment
    let assignment = await DeliveryRepository.findByMailId(mailId);
    if (!assignment) {
      assignment = await DeliveryRepository.create({
        mailId: mail.id,
        trackingNumber: mail.trackingNumber,
        category: mail.category,
        recipientName: mail.recipientName,
        recipientAddress: mail.recipientAddress,
        recipientPhone: mail.recipientPhone,
        assignedStaffId: staff.id,
        assignedStaffName: staff.name,
        assignedStaffEmployeeId: staff.employeeId,
        assignedBy: actor.name,
        status: MailStatus.OUT_FOR_DELIVERY,
        officeId: actor.officeId
      });
    } else {
      assignment = await DeliveryRepository.update(assignment.id, {
        assignedStaffId: staff.id,
        assignedStaffName: staff.name,
        assignedStaffEmployeeId: staff.employeeId,
        status: MailStatus.OUT_FOR_DELIVERY
      });
    }

    // Audit log
    await AuditRepository.log({
      userId: actor.id,
      userName: actor.name,
      userRole: actor.role,
      action: 'DELIVERY_ASSIGNED',
      module: 'DELIVERY',
      entityId: mail.id,
      details: `Mail ${mail.trackingNumber} assigned for delivery to ${staff.name} (${staff.employeeId})`,
      officeId: actor.officeId
    });

    // Notify staff
    await NotificationRepository.create({
      title: `Delivery Assigned: ${mail.trackingNumber}`,
      titleTa: `விநியோகம் ஒதுக்கப்பட்டது: ${mail.trackingNumber}`,
      message: `You have been assigned ${mail.trackingNumber} for ${mail.recipientAddress}`,
      messageTa: `உங்களுக்கு ${mail.trackingNumber} விநியோகம் ஒதுக்கப்பட்டுள்ளது`,
      type: 'INFO',
      category: 'DELIVERY',
      relatedId: mail.id,
      targetUserId: staff.id,
      officeId: actor.officeId
    });

    return { mail: updatedMail, assignment };
  }

  /**
   * Core Engine Step 3: Delivery Status Update
   * Central single-source-of-truth update. Updates delivery assignment,
   * adds status history, updates reports, sends exception notifications if needed.
   */
  static async updateDeliveryStatus(
    mailId: string,
    status: MailStatus.DELIVERED | MailStatus.EXCEPTION | MailStatus.OUT_FOR_DELIVERY,
    details: {
      deliveredTo?: string;
      recipientRelationship?: string;
      signatureDataUrl?: string;
      exceptionReason?: DeliveryExceptionReason;
      exceptionNotes?: string;
      notes?: string;
    },
    actor: { id: string; name: string; role: string; officeId: string }
  ): Promise<any> {
    const mail = await MailRepository.findById(mailId);
    if (!mail) throw new Error(`Mail item not found: ${mailId}`);

    const timestamp = new Date().toISOString();
    const historyNote = status === MailStatus.DELIVERED
      ? `Delivered to ${details.deliveredTo || mail.recipientName} (${details.recipientRelationship || 'Self'})`
      : `Delivery Exception: ${details.exceptionReason || 'Unknown'} - ${details.exceptionNotes || ''}`;

    // Update central mail record
    const updatedMail = await MailRepository.addStatusHistory(mailId, {
      status,
      timestamp,
      updatedBy: actor.id,
      updatedByName: actor.name,
      notes: historyNote
    });

    await MailRepository.update(mailId, {
      currentStatus: status,
      deliveryAttemptCount: (mail.deliveryAttemptCount || 0) + 1,
      lastDeliveryAttemptDate: timestamp,
      deliveredTo: details.deliveredTo,
      deliveredTimestamp: status === MailStatus.DELIVERED ? timestamp : undefined,
      deliveryExceptionReason: details.exceptionReason,
      deliveryNotes: details.notes || details.exceptionNotes,
      digitalSignature: details.signatureDataUrl
    });

    // Update delivery assignment
    const assignment = await DeliveryRepository.findByMailId(mailId);
    if (assignment) {
      await DeliveryRepository.update(assignment.id, {
        status,
        deliveredTimestamp: status === MailStatus.DELIVERED ? timestamp : undefined,
        deliveredTo: details.deliveredTo,
        recipientRelationship: details.recipientRelationship,
        signatureDataUrl: details.signatureDataUrl,
        exceptionReason: details.exceptionReason,
        exceptionNotes: details.exceptionNotes,
        lastAttemptTimestamp: timestamp,
        deliveryAttemptCount: (assignment.deliveryAttemptCount || 1) + 1
      });
    }

    // Audit log
    await AuditRepository.log({
      userId: actor.id,
      userName: actor.name,
      userRole: actor.role,
      action: status === MailStatus.DELIVERED ? 'DELIVERY_COMPLETED' : 'DELIVERY_EXCEPTION',
      module: 'DELIVERY',
      entityId: mailId,
      details: `Delivery status for ${mail.trackingNumber} updated to ${status}. Details: ${historyNote}`,
      officeId: actor.officeId
    });

    // If Exception, alert Postmaster
    if (status === MailStatus.EXCEPTION) {
      await NotificationRepository.create({
        title: `Delivery Exception: ${mail.trackingNumber}`,
        titleTa: `விநியோக விதிவிலக்கு: ${mail.trackingNumber}`,
        message: `Reason: ${details.exceptionReason}. Staff: ${actor.name}. Action required.`,
        messageTa: `காரணம்: ${details.exceptionReason}. பணியாளர்: ${actor.name}. நடவடிக்கை தேவை.`,
        type: 'ALERT',
        category: 'DELIVERY',
        relatedId: mailId,
        targetRole: 'POSTMASTER',
        officeId: actor.officeId
      });
    }

    return { mail: updatedMail, assignment };
  }

  /**
   * Core Engine Step 4: Auto-Generate Daily Report from Verified Records
   * Zero repeated data entry!
   */
  static async compileDailyOperationsReport(
    officeId: string,
    date: string,
    actor: { id: string; name: string },
    reportType: ReportType = ReportType.DAILY_OPERATIONS
  ): Promise<DailyOperationsReport> {
    const day = date.slice(0, 10);
    const monthPrefix = day.slice(0, 7);
    const office = (await UserRepository.getOffice(officeId)) || {
      id: officeId,
      name: 'Anna Nagar Sub Post Office',
      code: 'PO-600001'
    };

    // Aggregate Mail
    const { items: allMail } = await MailRepository.filter({ officeId, limit: 5000 });
    const dayMail = reportType === ReportType.MONTHLY_SUMMARY
      ? allMail.filter(m => m.receivedDate.slice(0, 7) === monthPrefix || m.updatedAt.slice(0, 7) === monthPrefix)
      : allMail.filter(m => m.receivedDate.slice(0, 10) === day || m.updatedAt.slice(0, 10) === day);

    const totalIncoming = dayMail.filter(m => m.direction === MailDirection.INCOMING).length;
    const totalOutgoing = dayMail.filter(m => m.direction === MailDirection.OUTGOING).length;
    const totalSorted = dayMail.filter(m => m.currentStatus === MailStatus.SORTED || m.currentStatus === MailStatus.OUT_FOR_DELIVERY || m.currentStatus === MailStatus.DELIVERED).length;
    const totalDispatched = dayMail.filter(m => m.currentStatus === MailStatus.DISPATCHED).length;
    const pendingSorting = dayMail.filter(m => m.currentStatus === MailStatus.RECEIVED || m.currentStatus === MailStatus.SCANNED).length;

    // Aggregate Delivery
    const deliverySummary = await DeliveryRepository.getSummary(officeId);
    const dayDelivered = dayMail.filter(m => m.currentStatus === MailStatus.DELIVERED && m.deliveredTimestamp?.slice(0, 10) === day).length;
    const dayExceptions = dayMail.filter(m => m.currentStatus === MailStatus.EXCEPTION && m.lastDeliveryAttemptDate?.slice(0, 10) === day).length;

    // Aggregate Cash
    const cashBalance = await CashbookRepository.recalculateDailyBalance(officeId, day);

    // Aggregate Staff Workload
    const staffList = await UserRepository.getAllStaff(officeId);
    const workloadDistribution = staffList.map(s => {
      const assigned = allMail.filter(m => m.assignedStaffId === s.id).length;
      const completed = allMail.filter(m => m.assignedStaffId === s.id && m.currentStatus === MailStatus.DELIVERED).length;
      return {
        staffName: s.name,
        role: s.role,
        assigned,
        completed
      };
    });

    const report: DailyOperationsReport = {
      id: `REPORT-${reportType}-${day.replace(/-/g, '')}-${office.code}`,
      reportDate: day,
      reportType,
      officeId,
      officeName: office.name,
      officeCode: office.code,
      generatedAt: new Date().toISOString(),
      generatedBy: actor.id,
      generatedByName: actor.name,
      isApproved: false,
      mailSummary: {
        totalIncoming,
        totalOutgoing,
        totalSorted,
        totalDispatched,
        pendingSorting,
        categoryBreakdown: {
          speedPost: dayMail.filter(m => m.category === MailCategory.SPEED_POST).length,
          registeredPost: dayMail.filter(m => m.category === MailCategory.REGISTERED_POST).length,
          parcel: dayMail.filter(m => m.category === MailCategory.PARCEL).length,
          ordinaryLetter: dayMail.filter(m => m.category === MailCategory.ORDINARY_LETTER).length,
          bookPost: dayMail.filter(m => m.category === MailCategory.BOOK_POST).length,
          moneyOrder: dayMail.filter(m => m.category === MailCategory.MONEY_ORDER).length
        }
      },
      deliverySummary: {
        totalAssignedForDelivery: deliverySummary.totalAssigned,
        deliveredToday: dayDelivered,
        deliveryExceptions: dayExceptions,
        pendingDelivery: deliverySummary.pending,
        deliverySuccessRate: deliverySummary.totalAssigned > 0
          ? Math.round((dayDelivered / deliverySummary.totalAssigned) * 100)
          : 100
      },
      cashSummary: {
        openingBalance: cashBalance.openingBalance,
        totalReceipts: cashBalance.totalReceipts,
        totalPayments: cashBalance.totalPayments,
        calculatedClosingBalance: cashBalance.calculatedClosingBalance,
        verifiedPhysicalBalance: cashBalance.verifiedPhysicalBalance,
        isReconciled: cashBalance.reconciliationStatus === 'RECONCILED'
      },
      staffSummary: {
        totalStaffActive: staffList.filter(s => s.isActive).length,
        tasksAssigned: deliverySummary.totalAssigned,
        tasksCompleted: dayDelivered,
        workloadDistribution
      },
      remarks: 'Automatically compiled from verified central operational database.'
    };

    return ReportRepository.save(report);
  }
}
