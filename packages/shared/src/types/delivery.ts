import { MailStatus, DeliveryExceptionReason, MailCategory } from '../constants/statuses';

export interface IDeliveryAssignment {
  id: string;
  mailId: string;
  trackingNumber: string;
  category: MailCategory;
  recipientName: string;
  recipientAddress: string;
  recipientPhone?: string;
  assignedStaffId: string;
  assignedStaffName: string;
  assignedStaffEmployeeId: string;
  assignedDate: string;
  assignedBy: string;
  status: MailStatus;
  deliveryAttemptCount: number;
  lastAttemptTimestamp?: string;
  deliveredTimestamp?: string;
  deliveredTo?: string;
  recipientRelationship?: string;
  signatureDataUrl?: string;
  exceptionReason?: DeliveryExceptionReason;
  exceptionNotes?: string;
  officeId: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateDeliveryStatusDto {
  mailId: string;
  status: MailStatus.DELIVERED | MailStatus.EXCEPTION | MailStatus.OUT_FOR_DELIVERY;
  deliveredTo?: string;
  recipientRelationship?: string;
  signatureDataUrl?: string;
  exceptionReason?: DeliveryExceptionReason;
  exceptionNotes?: string;
  notes?: string;
}

export interface DeliverySummaryDto {
  totalAssigned: number;
  outForDelivery: number;
  delivered: number;
  exceptions: number;
  pending: number;
  staffDistribution: Array<{
    staffId: string;
    staffName: string;
    assignedCount: number;
    deliveredCount: number;
    exceptionCount: number;
    completionRate: number;
  }>;
}
