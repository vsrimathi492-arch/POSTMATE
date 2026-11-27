import { MailCategory, MailDirection, MailStatus, DeliveryExceptionReason } from '../constants/statuses';

export interface MailStatusHistoryEntry {
  status: MailStatus;
  timestamp: string;
  updatedBy: string;
  updatedByName: string;
  notes?: string;
  location?: string;
}

export interface IMailRecord {
  id: string;
  trackingNumber: string;
  direction: MailDirection;
  category: MailCategory;
  originOffice: string;
  originPincode: string;
  destinationOffice: string;
  destinationPincode: string;
  senderName: string;
  senderAddress: string;
  senderPhone?: string;
  recipientName: string;
  recipientAddress: string;
  recipientPhone?: string;
  weightGrams?: number;
  tariffAmount?: number;
  receivedDate: string;
  dispatchDate?: string;
  currentStatus: MailStatus;
  assignedStaffId?: string;
  assignedStaffName?: string;
  assignedStaffEmployeeId?: string;
  sortingBatchId?: string;
  sortingArea?: string;
  deliveryAttemptCount: number;
  lastDeliveryAttemptDate?: string;
  deliveryExceptionReason?: DeliveryExceptionReason;
  deliveryNotes?: string;
  digitalSignature?: string;
  deliveredTo?: string;
  deliveredTimestamp?: string;
  verificationSource?: 'MANUAL' | 'BARCODE_SCAN' | 'OCR_VERIFIED';
  statusHistory: MailStatusHistoryEntry[];
  officeId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMailDto {
  trackingNumber: string;
  direction: MailDirection;
  category: MailCategory;
  originOffice: string;
  originPincode: string;
  destinationOffice: string;
  destinationPincode: string;
  senderName: string;
  senderAddress: string;
  senderPhone?: string;
  recipientName: string;
  recipientAddress: string;
  recipientPhone?: string;
  weightGrams?: number;
  tariffAmount?: number;
  verificationSource?: 'MANUAL' | 'BARCODE_SCAN' | 'OCR_VERIFIED';
  notes?: string;
}

export interface UpdateMailDto {
  category?: MailCategory;
  destinationOffice?: string;
  destinationPincode?: string;
  recipientName?: string;
  recipientAddress?: string;
  recipientPhone?: string;
  assignedStaffId?: string;
  sortingBatchId?: string;
  sortingArea?: string;
  notes?: string;
}

export interface MailFilterDto {
  direction?: MailDirection;
  category?: MailCategory;
  status?: MailStatus;
  assignedStaffId?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface MailRegisterSummary {
  totalCount: number;
  speedPostCount: number;
  registeredPostCount: number;
  parcelCount: number;
  ordinaryLetterCount: number;
  moneyOrderCount: number;
  pendingCount: number;
  deliveredCount: number;
  exceptionCount: number;
}
