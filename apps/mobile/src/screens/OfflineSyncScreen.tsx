import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert
} from 'react-native';
import { OfflineStorage } from '../services/offlineStorage';
import { SyncService } from '../services/syncService';
import { mobileApi } from '../services/api';
import { OfflineSyncQueueItem, SyncConflict } from '@postmate/shared';

export const OfflineSyncScreen: React.FC = () => {
  const [queue, setQueue] = useState<OfflineSyncQueueItem[]>([]);
  const [conflicts, setConflicts] = useState<SyncConflict[]>([]);
  const [isOnline, setIsOnline] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);

  useEffect(() => {
    loadQueue();
  }, []);

  const loadQueue = async () => {
    const q = await OfflineStorage.getQueue();
    const c = await OfflineStorage.getConflicts();
    const online = await mobileApi.checkHealth();
    setQueue(q);
    setConflicts(c);
    setIsOnline(online);
  };

  const handleSyncNow = async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const res = await SyncService.runSync();
      setSyncResult(res.message);
      await loadQueue();
    } catch (e: any) {
      setSyncResult(e.message);
    } finally {
      setSyncing(false);
    }
  };

  const handleDismissConflict = async (localId: string) => {
    await OfflineStorage.resolveConflict(localId);
    await loadQueue();
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Offline Synchronization Center</Text>
      <Text style={styles.sub}>
        Local Storage Queue & Conflict-Free Central Database Sync
      </Text>

      {/* Connectivity Status Banner */}
      <View style={[styles.statusBox, isOnline ? styles.onlineBox : styles.offlineBox]}>
        <Text style={styles.statusTitle}>
          {isOnline ? '🟢 Connected to POSTMATE Central Server' : '🔴 Server Unreachable (Offline Mode)'}
        </Text>
        <Text style={styles.statusDesc}>
          {isOnline
            ? 'Ready to transmit local queue records.'
            : 'All operational records will safely persist in local device storage until connection returns.'}
        </Text>
      </View>

      {/* Sync Button */}
      <TouchableOpacity
        style={[styles.syncBtn, syncing && styles.syncBtnDisabled]}
        onPress={handleSyncNow}
        disabled={syncing}
      >
        {syncing ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text style={styles.syncBtnText}>🔄 Trigger Batch Synchronization</Text>
        )}
      </TouchableOpacity>

      {syncResult && (
        <View style={styles.resultBox}>
          <Text style={styles.resultText}>{syncResult}</Text>
        </View>
      )}

      {/* Conflicts Section if any */}
      {conflicts.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.conflictHeader}>⚠ Pending Conflicts ({conflicts.length})</Text>
          <Text style={styles.conflictDesc}>
            Server detects conflicting states. Review below to prevent silent data overwrites:
          </Text>

          {conflicts.map((c, i) => (
            <View key={i} style={styles.conflictCard}>
              <Text style={styles.conflictTitle}>{c.conflictReason}</Text>
              <Text style={styles.conflictSub}>Entity: {c.entityType} ({c.entityId})</Text>
              <TouchableOpacity
                style={styles.resolveBtn}
                onPress={() => handleDismissConflict(c.localId)}
              >
                <Text style={styles.resolveBtnText}>Acknowledge & Dismiss</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {/* Local Queue List */}
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>
          Local Offline Queue Items ({queue.length})
        </Text>

        {queue.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>Queue is clear. No pending offline operations.</Text>
          </View>
        ) : (
          queue.map((item) => (
            <View key={item.localId} style={styles.queueCard}>
              <View style={styles.queueRow}>
                <Text style={styles.queueAction}>{item.action}</Text>
                <Text style={styles.queueStatus}>{item.status}</Text>
              </View>
              <Text style={styles.queueId}>Local ID: {item.localId}</Text>
              <Text style={styles.queueTime}>Created: {new Date(item.createdAt).toLocaleTimeString()}</Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#f8fafc',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  sub: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
    marginBottom: 16,
  },
  statusBox: {
    padding: 14,
    borderRadius: 12,
    marginBottom: 16,
  },
  onlineBox: {
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  offlineBox: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  statusTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  statusDesc: {
    fontSize: 11,
    color: '#475569',
    marginTop: 2,
  },
  syncBtn: {
    backgroundColor: '#2563eb',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  syncBtnDisabled: {
    opacity: 0.6,
  },
  syncBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  resultBox: {
    backgroundColor: '#eff6ff',
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  resultText: {
    color: '#1e40af',
    fontSize: 12,
    fontWeight: '600',
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#334155',
    marginBottom: 10,
  },
  conflictHeader: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#dc2626',
    marginBottom: 4,
  },
  conflictDesc: {
    fontSize: 11,
    color: '#64748b',
    marginBottom: 10,
  },
  conflictCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#fca5a5',
    marginBottom: 8,
  },
  conflictTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#991b1b',
  },
  conflictSub: {
    fontSize: 11,
    color: '#475569',
    marginTop: 2,
  },
  resolveBtn: {
    marginTop: 8,
    backgroundColor: '#fef2f2',
    padding: 6,
    borderRadius: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f87171',
  },
  resolveBtnText: {
    color: '#dc2626',
    fontSize: 11,
    fontWeight: 'bold',
  },
  queueCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 8,
  },
  queueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  queueAction: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  queueStatus: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#d97706',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  queueId: {
    fontSize: 11,
    fontFamily: 'monospace',
    color: '#64748b',
  },
  queueTime: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 2,
  },
  emptyCard: {
    backgroundColor: '#ffffff',
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  emptyText: {
    color: '#94a3b8',
    fontSize: 12,
  },
});
