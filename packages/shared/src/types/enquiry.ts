import { MailCategory, MailStatus } from '../constants/statuses';

export interface ICustomerEnquiry {
  id: string;
  enquiryNumber: string;
  trackingNumber: string;
  enquiryDate: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  enquiryType: 'STATUS_CHECK' | 'DELAY_QUERY' | 'MISDELIVERY_COMPLAINT' | 'GENERAL_QUERY';
  subject: string;
  description: string;
  recordedBy: string;
  recordedByName: string;
  statusAtEnquiryTime: MailStatus;
  mailCategory?: MailCategory;
  resolutionStatus: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  resolutionNotes?: string;
  followUpDate?: string;
  officeId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEnquiryDto {
  trackingNumber: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  enquiryType: 'STATUS_CHECK' | 'DELAY_QUERY' | 'MISDELIVERY_COMPLAINT' | 'GENERAL_QUERY';
  subject: string;
  description: string;
  followUpDate?: string;
}

export interface EnquirySearchResult {
  found: boolean;
  trackingNumber: string;
  category?: MailCategory;
  currentStatus?: MailStatus;
  originOffice?: string;
  destinationOffice?: string;
  receivedDate?: string;
  deliveryAttemptCount?: number;
  lastUpdateDate?: string;
  enquiryHistory: ICustomerEnquiry[];
}
