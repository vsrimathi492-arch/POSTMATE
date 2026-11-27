import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface OfflineBannerProps {
  isOnline: boolean;
  pendingCount: number;
  onSyncPress?: () => void;
}

export const OfflineBanner: React.FC<OfflineBannerProps> = ({ isOnline, pendingCount, onSyncPress }) => {
  if (isOnline && pendingCount === 0) return null;

  return (
    <View style={[styles.container, isOnline ? styles.syncNotice : styles.offlineNotice]}>
      <View style={styles.textWrap}>
        <Text style={styles.title}>
          {isOnline ? 'Online • Unsynced Changes' : 'Offline Mode Active'}
        </Text>
        <Text style={styles.subtitle}>
          {pendingCount} operational item{pendingCount !== 1 ? 's' : ''} stored safely in local queue
        </Text>
      </View>
      {isOnline && onSyncPress && (
        <TouchableOpacity style={styles.syncBtn} onPress={onSyncPress}>
          <Text style={styles.syncBtnText}>Sync</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  offlineNotice: {
    backgroundColor: '#dc2626',
  },
  syncNotice: {
    backgroundColor: '#d97706',
  },
  textWrap: {
    flex: 1,
  },
  title: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  subtitle: {
    color: '#fef2f2',
    fontSize: 11,
    marginTop: 2,
  },
  syncBtn: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 6,
    marginLeft: 10,
  },
  syncBtnText: {
    color: '#0f172a',
    fontWeight: 'bold',
    fontSize: 11,
  },
});
