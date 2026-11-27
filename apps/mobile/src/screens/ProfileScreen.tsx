import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, TextInput, ScrollView } from 'react-native';
import { getApiBaseUrl, setApiBaseUrl } from '../services/api';
import { useMobileLanguage } from '../context/LanguageContext';

interface ProfileScreenProps {
  user: any;
  onLogout: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ user, onLogout }) => {
  const { language, setLanguage, t } = useMobileLanguage();
  const [serverUrl, setServerUrl] = useState('http://10.0.2.2:5000');
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  useEffect(() => {
    getApiBaseUrl().then(setServerUrl);
  }, []);

  const handleSaveServerUrl = async () => {
    const cleaned = await setApiBaseUrl(serverUrl);
    setServerUrl(cleaned);
    setSavedNotice(`Saved API Endpoint: ${cleaned}`);
    setTimeout(() => setSavedNotice(null), 3000);
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to exit the POSTMATE mobile terminal?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: onLogout }
    ]);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{t.tabs.profile}</Text>
      <Text style={styles.sub}>Terminal Session, Language & Server Configuration</Text>

      <View style={styles.card}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user?.name?.slice(0, 2).toUpperCase() || 'PM'}</Text>
        </View>

        <Text style={styles.name}>{user?.name || 'Staff'}</Text>
        <Text style={styles.empId}>Employee ID: {user?.employeeId || 'PMTS600042'}</Text>
        <Text style={styles.role}>{user?.role?.replace(/_/g, ' ') || 'POSTAL STAFF'}</Text>

        <View style={styles.infoList}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Assigned Office:</Text>
            <Text style={styles.infoVal}>{user?.officeName || 'Anna Nagar Sub Post Office'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Office Code:</Text>
            <Text style={styles.infoVal}>{user?.officeId || 'PO-600001'} (600040)</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Circle & Division:</Text>
            <Text style={styles.infoVal}>Tamil Nadu Circle, Chennai Central</Text>
          </View>
        </View>

        {/* Bilingual Language Switch */}
        <View style={styles.configBlock}>
          <Text style={styles.configTitle}>Language / மொழி</Text>
          <View style={styles.langRow}>
            <TouchableOpacity
              style={[styles.langBtn, language === 'en' && styles.langBtnActive]}
              onPress={() => setLanguage('en')}
            >
              <Text style={[styles.langText, language === 'en' && styles.langTextActive]}>English</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.langBtn, language === 'ta' && styles.langBtnActive]}
              onPress={() => setLanguage('ta')}
            >
              <Text style={[styles.langText, language === 'ta' && styles.langTextActive]}>தமிழ் (Tamil)</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Configurable API Base URL for Android Physical Device / LAN */}
        <View style={styles.configBlock}>
          <Text style={styles.configTitle}>Backend Server URL</Text>
          <TextInput
            style={styles.urlInput}
            value={serverUrl}
            onChangeText={setServerUrl}
            autoCapitalize="none"
            placeholder="http://10.0.2.2:5000"
          />
          <TouchableOpacity style={styles.saveUrlBtn} onPress={handleSaveServerUrl}>
            <Text style={styles.saveUrlBtnText}>Save Server URL</Text>
          </TouchableOpacity>
          {savedNotice && <Text style={styles.savedNotice}>{savedNotice}</Text>}
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutBtnText}>Sign Out of Terminal</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  empId: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  role: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1d4ed8',
    backgroundColor: '#dbeafe',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 8,
  },
  infoList: {
    width: '100%',
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderColor: '#f1f5f9',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  infoLabel: {
    fontSize: 12,
    color: '#64748b',
  },
  infoVal: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0f172a',
  },
  configBlock: {
    width: '100%',
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderColor: '#f1f5f9',
  },
  configTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#334155',
    marginBottom: 8,
  },
  langRow: {
    flexDirection: 'row',
    gap: 8,
  },
  langBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  langBtnActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  langText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  langTextActive: {
    color: '#ffffff',
  },
  urlInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 12,
    marginBottom: 8,
  },
  saveUrlBtn: {
    backgroundColor: '#0f172a',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveUrlBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  savedNotice: {
    fontSize: 11,
    color: '#059669',
    marginTop: 6,
    fontWeight: '600',
  },
  logoutBtn: {
    marginTop: 24,
    width: '100%',
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  logoutBtnText: {
    color: '#dc2626',
    fontWeight: 'bold',
    fontSize: 13,
  },
});
