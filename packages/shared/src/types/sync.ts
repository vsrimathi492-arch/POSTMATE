import { SyncStatus } from '../constants/statuses';

export interface OfflineSyncQueueItem {
  localId: string;
  action: 'CREATE_MAIL' | 'UPDATE_DELIVERY' | 'UPDATE_SORTING' | 'CREATE_CASH_TRANSACTION';
  entityType: 'MAIL' | 'DELIVERY' | 'SORTING' | 'CASH';
  payload: any;
  createdAt: string;
  attempts: number;
  status: SyncStatus;
  errorMessage?: string;
}

export interface SyncConflict {
  localId: string;
  entityId: string;
  entityType: string;
  serverVersion: any;
  localVersion: any;
  conflictReason: string;
}

export interface SyncBatchRequest {
  deviceId: string;
  userId: string;
  officeId: string;
  items: OfflineSyncQueueItem[];
}

export interface SyncBatchResponse {
  success: boolean;
  syncedCount: number;
  failedCount: number;
  conflicts: SyncConflict[];
  results: Array<{
    localId: string;
    serverId: string;
    status: SyncStatus;
    error?: string;
  }>;
}
