import { MailCategory } from '../constants/statuses';

export interface ISortingBatch {
  id: string;
  batchNumber: string;
  officeId: string;
  destinationArea: string;
  destinationPincodes: string[];
  category?: MailCategory;
  mailItemIds: string[];
  totalItems: number;
  verifiedItems: number;
  status: 'OPEN' | 'IN_PROGRESS' | 'SORTED' | 'DISPATCHED';
  assignedStaffId?: string;
  assignedStaffName?: string;
  createdBy: string;
  createdByName: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSortingBatchDto {
  destinationArea: string;
  destinationPincodes: string[];
  category?: MailCategory;
  mailItemIds: string[];
  assignedStaffId?: string;
  notes?: string;
}

export interface SortingGroupSummary {
  destinationArea: string;
  pincode: string;
  itemCount: number;
  categories: Record<string, number>;
  items: Array<{
    id: string;
    trackingNumber: string;
    category: MailCategory;
    recipientName: string;
    recipientAddress: string;
  }>;
}
