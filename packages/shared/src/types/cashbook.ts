import { TransactionType, CashCategory } from '../constants/statuses';

export interface ICashTransaction {
  id: string;
  transactionNumber: string;
  date: string;
  type: TransactionType;
  category: CashCategory;
  amount: number;
  description: string;
  relatedRecordId?: string;
  relatedTrackingNumber?: string;
  enteredBy: string;
  enteredByName: string;
  verifiedBy?: string;
  verifiedByName?: string;
  verifiedAt?: string;
  isVerified: boolean;
  officeId: string;
  createdAt: string;
  updatedAt: string;
}

export interface IDailyCashBalance {
  id: string;
  date: string;
  officeId: string;
  openingBalance: number;
  totalReceipts: number;
  totalPayments: number;
  calculatedClosingBalance: number;
  verifiedPhysicalBalance?: number;
  discrepancyAmount?: number;
  reconciliationStatus: 'PENDING' | 'RECONCILED' | 'DISCREPANCY_NOTED';
  reconciledBy?: string;
  reconciledByName?: string;
  reconciledAt?: string;
  reconciliationNotes?: string;
  isClosed: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTransactionDto {
  date: string;
  type: TransactionType;
  category: CashCategory;
  amount: number;
  description: string;
  relatedTrackingNumber?: string;
}

export interface ReconcileCashbookDto {
  date: string;
  verifiedPhysicalBalance: number;
  notes?: string;
}
