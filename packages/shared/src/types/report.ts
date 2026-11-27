import { ReportType } from '../constants/statuses';

export interface DailyOperationsReport {
  id: string;
  reportDate: string;
  reportType: ReportType;
  officeId: string;
  officeName: string;
  officeCode: string;
  generatedAt: string;
  generatedBy: string;
  generatedByName: string;
  approvedBy?: string;
  approvedByName?: string;
  approvedAt?: string;
  isApproved: boolean;

  // Mail Statistics
  mailSummary: {
    totalIncoming: number;
    totalOutgoing: number;
    totalSorted: number;
    totalDispatched: number;
    pendingSorting: number;
    categoryBreakdown: {
      speedPost: number;
      registeredPost: number;
      parcel: number;
      ordinaryLetter: number;
      bookPost: number;
      moneyOrder: number;
    };
  };

  // Delivery Statistics
  deliverySummary: {
    totalAssignedForDelivery: number;
    deliveredToday: number;
    deliveryExceptions: number;
    pendingDelivery: number;
    deliverySuccessRate: number;
  };

  // Cash Statistics
  cashSummary: {
    openingBalance: number;
    totalReceipts: number;
    totalPayments: number;
    calculatedClosingBalance: number;
    verifiedPhysicalBalance?: number;
    isReconciled: boolean;
  };

  // Staff Statistics
  staffSummary: {
    totalStaffActive: number;
    tasksAssigned: number;
    tasksCompleted: number;
    workloadDistribution: Array<{
      staffName: string;
      role: string;
      assigned: number;
      completed: number;
    }>;
  };

  remarks?: string;
}

export interface DateFilterDto {
  startDate?: string;
  endDate?: string;
  officeId?: string;
  type?: ReportType;
}
