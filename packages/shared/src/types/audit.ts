export interface IAuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: string;
  action: string;
  module: 'MAIL' | 'SORTING' | 'DELIVERY' | 'CASHBOOK' | 'STAFF' | 'REPORT' | 'ENQUIRY' | 'AUTH' | 'SYSTEM' | 'ADMIN';
  entityId?: string;
  details: string;
  ipAddress?: string;
  officeId: string;
}

export interface INotification {
  id: string;
  title: string;
  titleTa?: string;
  message: string;
  messageTa?: string;
  type: 'INFO' | 'WARNING' | 'ALERT' | 'SUCCESS';
  category: 'DELIVERY' | 'SORTING' | 'CASHBOOK' | 'REPORT' | 'SYNC' | 'GENERAL';
  relatedId?: string;
  isRead: boolean;
  createdAt: string;
  targetRole?: string;
  targetUserId?: string;
  officeId: string;
}
