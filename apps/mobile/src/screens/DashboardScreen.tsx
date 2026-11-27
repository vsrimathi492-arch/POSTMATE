import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl
} from 'react-native';
import { mobileApi } from '../services/api';
import { OfflineStorage } from '../services/offlineStorage';
import { SyncService } from '../services/syncService';
import { OfflineBanner } from '../components/OfflineBanner';
import { MailStatus } from '@postmate/shared';

interface DashboardScreenProps {
  user: any;
  onNavigate: (tab: string) => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({ user, onNavigate }) => {
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [pendingQueueCount, setPendingQueueCount] = useState(0);
  const [isOnline, setIsOnline] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setRefreshing(true);
    try {
      const online = await mobileApi.checkHealth();
      setIsOnline(online);

      const queue = await OfflineStorage.getQueue();
      setPendingQueueCount(queue.length);

      if (online) {
        const res = await mobileApi.getMyDeliveries();
        if (res.success) {
          const list = res.deliveries || [];
          setDeliveries(list);
          await OfflineStorage.cacheDeliveries(list);
        }
      } else {
        const cached = await OfflineStorage.getCachedDeliveries();
        setDeliveries(cached);
      }
    } catch {
      setIsOnline(false);
      const cached = await OfflineStorage.getCachedDeliveries();
      setDeliveries(cached);
    } finally {
      setRefreshing(false);
    }
  };

  const handleSync = async () => {
    await SyncService.runSync();
    loadData();
  };

  const totalAssigned = deliveries.length;
  const delivered = deliveries.filter(d => d.status === MailStatus.DELIVERED).length;
  const exceptions = deliveries.filter(d => d.status === MailStatus.EXCEPTION).length;
  const pending = deliveries.filter(d => d.status !== MailStatus.DELIVERED).length;

  return (
    <View style={styles.container}>
      <OfflineBanner
        isOnline={isOnline}
        pendingCount={pendingQueueCount}
        onSyncPress={handleSync}
      />

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadData} />}
      >
        {/* Welcome Header */}
        <View style={styles.welcomeCard}>
          <Text style={styles.welcomeSub}>BEAT OPERATIONS</Text>
          <Text style={styles.welcomeTitle}>{user?.name || 'Postal Staff'}</Text>
          <Text style={styles.empBadge}>ID: {user?.employeeId} • {user?.officeName || 'Anna Nagar SO'}</Text>
        </View>

        {/* Beat Delivery Progress */}
        <View style={styles.statsGrid}>
          <TouchableOpacity style={styles.statBox} onPress={() => onNavigate('tasks')}>
            <Text style={styles.statLabel}>MY DELIVERIES</Text>
            <Text style={styles.statValue}>{totalAssigned}</Text>
            <Text style={styles.statSub}>Assigned for today</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.statBox} onPress={() => onNavigate('tasks')}>
            <Text style={[styles.statLabel, { color: '#059669' }]}>COMPLETED</Text>
            <Text style={[styles.statValue, { color: '#059669' }]}>{delivered}</Text>
            <Text style={styles.statSub}>Signed & Delivered</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.statBox} onPress={() => onNavigate('tasks')}>
            <Text style={[styles.statLabel, { color: '#d97706' }]}>PENDING BEAT</Text>
            <Text style={[styles.statValue, { color: '#d97706' }]}>{pending}</Text>
            <Text style={styles.statSub}>In transit</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.statBox} onPress={() => onNavigate('tasks')}>
            <Text style={[styles.statLabel, { color: '#dc2626' }]}>EXCEPTIONS</Text>
            <Text style={[styles.statValue, { color: '#dc2626' }]}>{exceptions}</Text>
            <Text style={styles.statSub}>Door locked / Intimated</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Action Buttons */}
        <View style={styles.actionSection}>
          <Text style={styles.sectionTitle}>QUICK MOBILE ACTIONS</Text>

          <TouchableOpacity style={styles.actionBtnPrimary} onPress={() => onNavigate('scan')}>
            <Text style={styles.actionBtnTitle}>📷 Scan & Verify Consignment</Text>
            <Text style={styles.actionBtnSub}>Barcode scan with offline fallback & OCR</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtnSecondary} onPress={() => onNavigate('tasks')}>
            <Text style={styles.actionBtnSecTitle}>📦 My Beat Deliveries ({pending} pending)</Text>
            <Text style={styles.actionBtnSecSub}>Update delivery statuses & digital signatures</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtnSecondary} onPress={() => onNavigate('sync')}>
            <Text style={styles.actionBtnSecTitle}>🔄 Offline Sync Queue ({pendingQueueCount})</Text>
            <Text style={styles.actionBtnSecSub}>Inspect local offline queue & conflict resolution</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f5f9',
  },
  content: {
    padding: 16,
  },
  welcomeCard: {
    backgroundColor: '#0b1d3a',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  welcomeSub: {
    color: '#93c5fd',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  welcomeTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 2,
  },
  empBadge: {
    color: '#cbd5e1',
    fontSize: 11,
    marginTop: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  statBox: {
    width: '48%',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  statLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#64748b',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0f172a',
    marginTop: 4,
  },
  statSub: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 2,
  },
  actionSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#64748b',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  actionBtnPrimary: {
    backgroundColor: '#2563eb',
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
  },
  actionBtnTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  actionBtnSub: {
    color: '#bfdbfe',
    fontSize: 11,
    marginTop: 2,
  },
  actionBtnSecondary: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    marginBottom: 10,
  },
  actionBtnSecTitle: {
    color: '#0f172a',
    fontSize: 14,
    fontWeight: 'bold',
  },
  actionBtnSecSub: {
    color: '#64748b',
    fontSize: 11,
    marginTop: 2,
  },
});
