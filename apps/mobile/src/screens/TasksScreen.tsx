import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Modal,
  TextInput,
  Alert
} from 'react-native';
import { mobileApi } from '../services/api';
import { OfflineStorage } from '../services/offlineStorage';
import { MailStatus, DeliveryExceptionReason } from '@postmate/shared';

export const TasksScreen: React.FC = () => {
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'PENDING' | 'DELIVERED'>('PENDING');

  // Modal State
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [updateMode, setUpdateMode] = useState<'DELIVERED' | 'EXCEPTION'>('DELIVERED');
  const [deliveredTo, setDeliveredTo] = useState('');
  const [exceptionReason, setExceptionReason] = useState<DeliveryExceptionReason>(DeliveryExceptionReason.DOOR_LOCKED);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    loadDeliveries();
  }, []);

  const loadDeliveries = async () => {
    setLoading(true);
    try {
      const isOnline = await mobileApi.checkHealth();
      if (isOnline) {
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
      const cached = await OfflineStorage.getCachedDeliveries();
      setDeliveries(cached);
    } finally {
      setLoading(false);
    }
  };

  const openStatusModal = (item: any, mode: 'DELIVERED' | 'EXCEPTION') => {
    setSelectedItem(item);
    setUpdateMode(mode);
    setDeliveredTo(item.recipientName);
    setNotes('');
  };

  const handleCommitStatus = async () => {
    if (!selectedItem) return;

    const payload = {
      mailId: selectedItem.mailId,
      status: updateMode === 'DELIVERED' ? MailStatus.DELIVERED : MailStatus.EXCEPTION,
      details: {
        deliveredTo: updateMode === 'DELIVERED' ? deliveredTo : undefined,
        signatureDataUrl: updateMode === 'DELIVERED' ? 'data:image/svg+xml;utf8,mobile-sign' : undefined,
        exceptionReason: updateMode === 'EXCEPTION' ? exceptionReason : undefined,
        exceptionNotes: notes
      }
    };

    const isOnline = await mobileApi.checkHealth();
    if (isOnline) {
      try {
        await mobileApi.updateDeliveryStatus(selectedItem.mailId, {
          status: payload.status,
          ...payload.details
        });
      } catch {
        await saveOfflineDelivery(payload);
      }
    } else {
      await saveOfflineDelivery(payload);
    }

    // Local Optimistic Update + Offline Cache Sync
    setDeliveries(prev => {
      const next = prev.map(d =>
        d.mailId === selectedItem.mailId
          ? { ...d, status: payload.status, deliveredTo: payload.details.deliveredTo }
          : d
      );
      OfflineStorage.cacheDeliveries(next).catch(() => {});
      return next;
    });

    setSelectedItem(null);
  };

  const saveOfflineDelivery = async (payload: any) => {
    await OfflineStorage.enqueue({
      action: 'UPDATE_DELIVERY',
      entityType: 'DELIVERY',
      payload
    });
    Alert.alert('Offline Mode', 'Delivery update queued locally! Will sync when connection returns.');
  };

  const filtered = deliveries.filter(d =>
    filter === 'PENDING' ? d.status !== MailStatus.DELIVERED : d.status === MailStatus.DELIVERED
  );

  return (
    <View style={styles.container}>
      {/* Filter Tabs */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, filter === 'PENDING' && styles.tabActive]}
          onPress={() => setFilter('PENDING')}
        >
          <Text style={[styles.tabText, filter === 'PENDING' && styles.tabTextActive]}>
            Pending Deliveries ({deliveries.filter(d => d.status !== MailStatus.DELIVERED).length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, filter === 'DELIVERED' && styles.tabActive]}
          onPress={() => setFilter('DELIVERED')}
        >
          <Text style={[styles.tabText, filter === 'DELIVERED' && styles.tabTextActive]}>
            Completed ({deliveries.filter(d => d.status === MailStatus.DELIVERED).length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={loadDeliveries} />}
      >
        {filtered.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No deliveries in this tab.</Text>
          </View>
        ) : (
          filtered.map(item => (
            <View key={item.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.tracking}>{item.trackingNumber}</Text>
                <Text style={styles.category}>{item.category?.replace(/_/g, ' ')}</Text>
              </View>

              <Text style={styles.name}>{item.recipientName}</Text>
              <Text style={styles.address}>📍 {item.recipientAddress}</Text>

              {item.status !== MailStatus.DELIVERED && (
                <View style={styles.btnRow}>
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.btnDelivered]}
                    onPress={() => openStatusModal(item, 'DELIVERED')}
                  >
                    <Text style={styles.btnText}>✓ Mark Delivered</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionBtn, styles.btnException]}
                    onPress={() => openStatusModal(item, 'EXCEPTION')}
                  >
                    <Text style={[styles.btnText, { color: '#dc2626' }]}>⚠ Exception</Text>
                  </TouchableOpacity>
                </View>
              )}

              {item.status === MailStatus.DELIVERED && (
                <View style={styles.deliveredTag}>
                  <Text style={styles.deliveredTagText}>✓ Successfully Delivered to {item.deliveredTo || item.recipientName}</Text>
                </View>
              )}
            </View>
          ))
        )}
      </ScrollView>

      {/* Delivery Update Modal */}
      {selectedItem && (
        <Modal visible={!!selectedItem} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>
                {updateMode === 'DELIVERED' ? 'Confirm Delivery' : 'Record Delivery Exception'}
              </Text>
              <Text style={styles.modalSub}>Tracking: {selectedItem.trackingNumber}</Text>

              {updateMode === 'DELIVERED' ? (
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Delivered To (Name):</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={deliveredTo}
                    onChangeText={setDeliveredTo}
                  />
                  <View style={styles.signatureBox}>
                    <Text style={styles.sigPlaceholder}>✍ Recipient Digital Signature Stamped</Text>
                  </View>
                </View>
              ) : (
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Exception Reason:</Text>
                  <TouchableOpacity
                    style={styles.reasonOption}
                    onPress={() => setExceptionReason(DeliveryExceptionReason.DOOR_LOCKED)}
                  >
                    <Text style={[styles.reasonText, exceptionReason === DeliveryExceptionReason.DOOR_LOCKED && styles.reasonSelected]}>
                      Door Locked / Premises Closed
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.reasonOption}
                    onPress={() => setExceptionReason(DeliveryExceptionReason.INSUFFICIENT_ADDRESS)}
                  >
                    <Text style={[styles.reasonText, exceptionReason === DeliveryExceptionReason.INSUFFICIENT_ADDRESS && styles.reasonSelected]}>
                      Insufficient / Incomplete Address
                    </Text>
                  </TouchableOpacity>

                  <Text style={[styles.fieldLabel, { marginTop: 10 }]}>Intimation Remarks:</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="e.g. Notice slip affixed"
                    value={notes}
                    onChangeText={setNotes}
                  />
                </View>
              )}

              <View style={styles.modalBtnRow}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => setSelectedItem(null)}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.saveBtn, updateMode === 'EXCEPTION' && { backgroundColor: '#dc2626' }]}
                  onPress={handleCommitStatus}
                >
                  <Text style={styles.saveBtnText}>Save Update</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f5f9',
  },
  tabBar: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderColor: '#e2e8f0',
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: '#eff6ff',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  tabTextActive: {
    color: '#2563eb',
    fontWeight: 'bold',
  },
  list: {
    padding: 16,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  tracking: {
    fontFamily: 'monospace',
    fontWeight: 'bold',
    fontSize: 13,
    color: '#1e40af',
  },
  category: {
    fontSize: 10,
    fontWeight: 'bold',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  name: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  address: {
    fontSize: 12,
    color: '#475569',
    marginTop: 4,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  btnDelivered: {
    backgroundColor: '#059669',
  },
  btnException: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  btnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  deliveredTag: {
    marginTop: 10,
    padding: 8,
    backgroundColor: '#f0fdf4',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  deliveredTagText: {
    color: '#15803d',
    fontSize: 11,
    fontWeight: 'bold',
  },
  empty: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#94a3b8',
    fontSize: 13,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  modalSub: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
    marginBottom: 16,
  },
  fieldGroup: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    padding: 10,
    fontSize: 13,
  },
  signatureBox: {
    height: 60,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderStyle: 'dashed',
    borderRadius: 8,
    marginTop: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
  },
  sigPlaceholder: {
    color: '#059669',
    fontSize: 11,
    fontWeight: '600',
  },
  reasonOption: {
    padding: 10,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  reasonText: {
    fontSize: 12,
    color: '#334155',
  },
  reasonSelected: {
    fontWeight: 'bold',
    color: '#dc2626',
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    alignItems: 'center',
  },
  cancelBtnText: {
    color: '#334155',
    fontWeight: '600',
  },
  saveBtn: {
    flex: 1,
    backgroundColor: '#059669',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
});
