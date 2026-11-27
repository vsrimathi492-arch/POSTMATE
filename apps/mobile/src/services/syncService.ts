import { OfflineStorage } from './offlineStorage';
import { mobileApi } from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SyncBatchResponse } from '@postmate/shared';

export class SyncService {
  /**
   * Run synchronization of queued offline items
   */
  static async runSync(): Promise<{
    synced: boolean;
    syncedCount: number;
    failedCount: number;
    conflictsCount: number;
    message: string;
  }> {
    const queue = await OfflineStorage.getQueue();
    if (queue.length === 0) {
      return {
        synced: true,
        syncedCount: 0,
        failedCount: 0,
        conflictsCount: 0,
        message: 'No pending items in offline queue.'
      };
    }

    const isOnline = await mobileApi.checkHealth();
    if (!isOnline) {
      return {
        synced: false,
        syncedCount: 0,
        failedCount: queue.length,
        conflictsCount: 0,
        message: 'Offline: Cannot reach POSTMATE central server. Operations safely preserved in local queue.'
      };
    }

    const userRaw = await AsyncStorage.getItem('postmate_user');
    const user = userRaw ? JSON.parse(userRaw) : null;

    try {
      const response: SyncBatchResponse = await mobileApi.syncBatch({
        deviceId: 'POSTMAN-ANDROID-CLIENT',
        userId: user?.id || 'STAFF',
        officeId: user?.officeId || 'PO-600001',
        items: queue
      });

      // Update local queue with results
      if (response.results) {
        await OfflineStorage.updateQueueAfterSync(response.results);
      }

      // Save conflicts if any
      if (response.conflicts && response.conflicts.length > 0) {
        await OfflineStorage.saveConflicts(response.conflicts);
      }

      return {
        synced: response.success,
        syncedCount: response.syncedCount || 0,
        failedCount: response.failedCount || 0,
        conflictsCount: response.conflicts?.length || 0,
        message: `Synced ${response.syncedCount} records successfully. ${response.conflicts?.length || 0} conflicts noted.`
      };
    } catch (error: any) {
      return {
        synced: false,
        syncedCount: 0,
        failedCount: queue.length,
        conflictsCount: 0,
        message: error.message || 'Sync failed due to network exception.'
      };
    }
  }
}
