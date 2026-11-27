import AsyncStorage from '@react-native-async-storage/async-storage';
import { OfflineSyncQueueItem, SyncStatus, SyncConflict } from '@postmate/shared';

const QUEUE_KEY = 'postmate_offline_queue';
const CONFLICTS_KEY = 'postmate_sync_conflicts';
const LOCAL_CACHE_KEY = 'postmate_local_cache';

export class OfflineStorage {
  static async cacheDeliveries(deliveries: any[]): Promise<void> {
    try {
      await AsyncStorage.setItem(LOCAL_CACHE_KEY, JSON.stringify(deliveries));
    } catch (e) {
      console.error('Error caching deliveries:', e);
    }
  }

  static async getCachedDeliveries(): Promise<any[]> {
    try {
      const raw = await AsyncStorage.getItem(LOCAL_CACHE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }
  /**
   * Get all items pending sync in local queue
   */
  static async getQueue(): Promise<OfflineSyncQueueItem[]> {
    try {
      const raw = await AsyncStorage.getItem(QUEUE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.error('Error reading offline queue:', e);
      return [];
    }
  }

  /**
   * Add a new action to the offline queue
   */
  static async enqueue(item: Omit<OfflineSyncQueueItem, 'localId' | 'createdAt' | 'attempts' | 'status'>): Promise<OfflineSyncQueueItem> {
    const queue = await this.getQueue();
    const localId = `LOCAL-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newItem: OfflineSyncQueueItem = {
      localId,
      createdAt: new Date().toISOString(),
      attempts: 0,
      status: SyncStatus.PENDING,
      ...item
    };

    queue.push(newItem);
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    return newItem;
  }

  /**
   * Update queue items after server sync response
   */
  static async updateQueueAfterSync(results: Array<{ localId: string; serverId: string; status: SyncStatus; error?: string }>): Promise<void> {
    const queue = await this.getQueue();
    const resultMap = new Map(results.map(r => [r.localId, r]));

    // Remove successfully synced items, update failed ones
    const updated = queue.filter(item => {
      const res = resultMap.get(item.localId);
      if (!res) return true;
      if (res.status === SyncStatus.SYNCED) {
        return false; // Remove completed
      }
      item.attempts += 1;
      item.status = res.status;
      item.errorMessage = res.error;
      return true;
    });

    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(updated));
  }

  /**
   * Store conflicts that need user review
   */
  static async saveConflicts(conflicts: SyncConflict[]): Promise<void> {
    if (conflicts.length === 0) return;
    const existingRaw = await AsyncStorage.getItem(CONFLICTS_KEY);
    const existing: SyncConflict[] = existingRaw ? JSON.parse(existingRaw) : [];
    const combined = [...existing, ...conflicts];
    await AsyncStorage.setItem(CONFLICTS_KEY, JSON.stringify(combined));
  }

  static async getConflicts(): Promise<SyncConflict[]> {
    try {
      const raw = await AsyncStorage.getItem(CONFLICTS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  static async resolveConflict(localId: string): Promise<void> {
    const conflicts = await this.getConflicts();
    const remaining = conflicts.filter(c => c.localId !== localId);
    await AsyncStorage.setItem(CONFLICTS_KEY, JSON.stringify(remaining));
  }
}
