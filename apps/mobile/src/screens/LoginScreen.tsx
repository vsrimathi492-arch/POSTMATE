import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  ScrollView
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { mobileApi } from '../services/api';

interface LoginScreenProps {
  onLoginSuccess: (user: any) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [employeeId, setEmployeeId] = useState('PMTS600042'); // Default to Beat Postman
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (empId = employeeId, pwd = password) => {
    setLoading(true);
    setError(null);
    try {
      const res = await mobileApi.login(empId, pwd);
      if (res.success && res.token) {
        await AsyncStorage.setItem('postmate_token', res.token);
        await AsyncStorage.setItem('postmate_user', JSON.stringify(res.user));
        await AsyncStorage.setItem('postmate_office', JSON.stringify(res.office));
        onLoginSuccess(res.user);
      } else {
        setError(res.message || 'Login failed. Check employee credentials.');
      }
    } catch (e: any) {
      setError(e.message || 'Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.brandBox}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoText}>P</Text>
          </View>
          <Text style={styles.brandTitle}>POSTMATE</Text>
          <Text style={styles.brandSub}>Android Mobile Operations Terminal</Text>
          <Text style={styles.tagline}>"Less Manual Work. More Smart Operations."</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.quickTitle}>Demo Role Quick Selection:</Text>
          <View style={styles.roleGrid}>
            <TouchableOpacity
              style={styles.roleBtn}
              onPress={() => {
                setEmployeeId('PMTS600042');
                handleLogin('PMTS600042', 'password123');
              }}
            >
              <Text style={styles.roleBtnTitle}>Beat Postman</Text>
              <Text style={styles.roleBtnSub}>PMTS600042 (Delivery)</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.roleBtn}
              onPress={() => {
                setEmployeeId('PA600041');
                handleLogin('PA600041', 'password123');
              }}
            >
              <Text style={styles.roleBtnTitle}>Postal Assistant</Text>
              <Text style={styles.roleBtnSub}>PA600041 (Scanning)</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.roleBtn}
              onPress={() => {
                setEmployeeId('PM600040');
                handleLogin('PM600040', 'password123');
              }}
            >
              <Text style={styles.roleBtnTitle}>Postmaster</Text>
              <Text style={styles.roleBtnSub}>PM600040 (Supervisor)</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.roleBtn}
              onPress={() => {
                setEmployeeId('ADMIN001');
                handleLogin('ADMIN001', 'password123');
              }}
            >
              <Text style={styles.roleBtnTitle}>Administrator</Text>
              <Text style={styles.roleBtnSub}>ADMIN001 (Config)</Text>
            </TouchableOpacity>
          </View>

          {error && <Text style={styles.errorText}>{error}</Text>}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Employee ID</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. PMTS600042"
              value={employeeId}
              onChangeText={setEmployeeId}
              autoCapitalize="characters"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Password"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
          </View>

          <TouchableOpacity
            style={styles.submitBtn}
            onPress={() => handleLogin()}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.submitBtnText}>Sign In to Mobile Terminal</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b1d3a',
  },
  scroll: {
    padding: 20,
    justifyContent: 'center',
    minHeight: '100%',
  },
  brandBox: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoBadge: {
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  logoText: {
    color: '#ffffff',
    fontSize: 32,
    fontWeight: 'bold',
  },
  brandTitle: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  brandSub: {
    color: '#93c5fd',
    fontSize: 12,
    marginTop: 4,
  },
  tagline: {
    color: '#94a3b8',
    fontSize: 11,
    fontStyle: 'italic',
    marginTop: 6,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  quickTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#64748b',
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  roleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  roleBtn: {
    width: '48%',
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  roleBtnTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  roleBtnSub: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 2,
  },
  inputGroup: {
    marginBottom: 12,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
  },
  submitBtn: {
    backgroundColor: '#2563eb',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  submitBtnText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  errorText: {
    color: '#dc2626',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 10,
  },
});
