import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { LanguageProvider, useMobileLanguage } from './src/context/LanguageContext';
import { LoginScreen } from './src/screens/LoginScreen';
import { DashboardScreen } from './src/screens/DashboardScreen';
import { ScanScreen } from './src/screens/ScanScreen';
import { TasksScreen } from './src/screens/TasksScreen';
import { OfflineSyncScreen } from './src/screens/OfflineSyncScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';

function MobileShell() {
  const { t } = useMobileLanguage();
  const [user, setUser] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'scan' | 'tasks' | 'sync' | 'profile'>('dashboard');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const rawUser = await AsyncStorage.getItem('postmate_user');
      if (rawUser) {
        setUser(JSON.parse(rawUser));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem('postmate_token');
    await AsyncStorage.removeItem('postmate_user');
    await AsyncStorage.removeItem('postmate_office');
    setUser(null);
    setActiveTab('dashboard');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Initializing POSTMATE Mobile...</Text>
      </View>
    );
  }

  if (!user) {
    return <LoginScreen onLoginSuccess={(u) => setUser(u)} />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0b1d3a" />

      {/* App Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.logoPill}>
            <Text style={styles.logoPillText}>P</Text>
          </View>
          <View>
            <Text style={styles.appName}>POSTMATE</Text>
            <Text style={styles.appSubtitle}>Mobile Operations Terminal</Text>
          </View>
        </View>
        <Text style={styles.officeCode}>{user?.officeId || 'PO-600001'}</Text>
      </View>

      {/* Screen Body */}
      <View style={styles.body}>
        {activeTab === 'dashboard' && <DashboardScreen user={user} onNavigate={(tab: any) => setActiveTab(tab)} />}
        {activeTab === 'scan' && <ScanScreen />}
        {activeTab === 'tasks' && <TasksScreen />}
        {activeTab === 'sync' && <OfflineSyncScreen />}
        {activeTab === 'profile' && <ProfileScreen user={user} onLogout={handleLogout} />}
      </View>

      {/* Bottom Navigation Tab Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={styles.tabBtn}
          onPress={() => setActiveTab('dashboard')}
        >
          <Text style={[styles.tabIcon, activeTab === 'dashboard' && styles.tabActiveText]}>🏠</Text>
          <Text style={[styles.tabLabel, activeTab === 'dashboard' && styles.tabActiveText]}>{t.tabs.dashboard}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabBtn}
          onPress={() => setActiveTab('scan')}
        >
          <Text style={[styles.tabIcon, activeTab === 'scan' && styles.tabActiveText]}>📷</Text>
          <Text style={[styles.tabLabel, activeTab === 'scan' && styles.tabActiveText]}>{t.tabs.scan}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabBtn}
          onPress={() => setActiveTab('tasks')}
        >
          <Text style={[styles.tabIcon, activeTab === 'tasks' && styles.tabActiveText]}>📦</Text>
          <Text style={[styles.tabLabel, activeTab === 'tasks' && styles.tabActiveText]}>{t.tabs.tasks}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabBtn}
          onPress={() => setActiveTab('sync')}
        >
          <Text style={[styles.tabIcon, activeTab === 'sync' && styles.tabActiveText]}>🔄</Text>
          <Text style={[styles.tabLabel, activeTab === 'sync' && styles.tabActiveText]}>{t.tabs.sync}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabBtn}
          onPress={() => setActiveTab('profile')}
        >
          <Text style={[styles.tabIcon, activeTab === 'profile' && styles.tabActiveText]}>👤</Text>
          <Text style={[styles.tabLabel, activeTab === 'profile' && styles.tabActiveText]}>{t.tabs.profile}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <MobileShell />
    </LanguageProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b1d3a',
  },
  header: {
    backgroundColor: '#0b1d3a',
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderColor: '#1e293b',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoPill: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoPillText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  appName: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 16,
    letterSpacing: 0.5,
  },
  appSubtitle: {
    color: '#94a3b8',
    fontSize: 10,
  },
  officeCode: {
    color: '#93c5fd',
    fontSize: 11,
    fontFamily: 'monospace',
    backgroundColor: '#1e293b',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  body: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderColor: '#e2e8f0',
    paddingVertical: 8,
    paddingBottom: 12,
  },
  tabBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIcon: {
    fontSize: 18,
    marginBottom: 2,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748b',
  },
  tabActiveText: {
    color: '#2563eb',
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0b1d3a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
});
