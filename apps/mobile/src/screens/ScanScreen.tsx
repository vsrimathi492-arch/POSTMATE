import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator
} from 'react-native';
import { mobileApi } from '../services/api';
import { OfflineStorage } from '../services/offlineStorage';
import { MailCategory, MailDirection } from '@postmate/shared';

export const ScanScreen: React.FC = () => {
  const [barcodeInput, setBarcodeInput] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [extractedData, setExtractedData] = useState<any | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isDuplicate, setIsDuplicate] = useState(false);
  const [staffVerified, setStaffVerified] = useState(false);
  const [loading, setLoading] = useState(false);

  const simulateScan = (prefix = 'SP') => {
    setIsScanning(true);
    setStatusMessage(null);
    setIsDuplicate(false);
    setStaffVerified(false);

    const generated = prefix + Math.floor(100000000 + Math.random() * 900000000) + 'IN';
    setBarcodeInput(generated);

    setTimeout(async () => {
      setIsScanning(false);
      try {
        const isOnline = await mobileApi.checkHealth();
        if (isOnline) {
          const ocrRes = await mobileApi.extractOcr(generated);
          if (ocrRes.success) {
            setExtractedData(ocrRes.extractedData);
            setIsDuplicate(ocrRes.isDuplicate);
          }
        } else {
          // Offline mock extraction fallback
          setExtractedData({
            trackingNumber: generated,
            category: prefix === 'RP' ? MailCategory.REGISTERED_POST : MailCategory.SPEED_POST,
            direction: MailDirection.INCOMING,
            recipientName: 'K. Senthil Nathan',
            recipientAddress: '14, 2nd Avenue, Anna Nagar, Chennai',
            destinationPincode: '600040',
            weightGrams: 160,
            confidenceScore: 0.92
          });
        }
      } catch (e: any) {
        setStatusMessage(e.message);
      }
    }, 600);
  };

  const handleCommit = async () => {
    if (!extractedData) return;
    if (!staffVerified) {
      setStatusMessage('Please confirm physical parcel verification.');
      return;
    }

    setLoading(true);
    setStatusMessage(null);

    const isOnline = await mobileApi.checkHealth();
    const mailPayload = {
      trackingNumber: extractedData.trackingNumber,
      direction: extractedData.direction || MailDirection.INCOMING,
      category: extractedData.category || MailCategory.SPEED_POST,
      originOffice: 'New Delhi GPO',
      originPincode: '110001',
      destinationOffice: 'Anna Nagar Sub Post Office',
      destinationPincode: extractedData.destinationPincode || '600040',
      recipientName: extractedData.recipientName,
      recipientAddress: extractedData.recipientAddress,
      weightGrams: extractedData.weightGrams || 150,
      verificationSource: 'OCR_VERIFIED'
    };

    if (isOnline) {
      try {
        const res = await mobileApi.createMail(mailPayload);
        if (res.success) {
          setStatusMessage(`✅ Consignment ${extractedData.trackingNumber} successfully verified & saved to server!`);
          setExtractedData(null);
          setBarcodeInput('');
        } else if (res.isDuplicate) {
          setIsDuplicate(true);
          setStatusMessage(`Duplicate Warning: ${res.message}`);
        } else {
          setStatusMessage(res.message);
        }
      } catch (err: any) {
        // Enqueue offline
        await saveOffline(mailPayload);
      }
    } else {
      // Direct Offline Queue
      await saveOffline(mailPayload);
    }
    setLoading(false);
  };

  const saveOffline = async (payload: any) => {
    await OfflineStorage.enqueue({
      action: 'CREATE_MAIL',
      entityType: 'MAIL',
      payload
    });
    setStatusMessage(`💾 Saved to OFFLINE QUEUE! Item will automatically synchronize when internet reconnects.`);
    setExtractedData(null);
    setBarcodeInput('');
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Smart Mail Scanning</Text>
      <Text style={styles.sub}>Barcode Scanning & Offline-First Data Entry</Text>

      {/* Simulated Camera Viewfinder */}
      <View style={styles.cameraBox}>
        <View style={styles.reticle}>
          <Text style={styles.reticleText}>
            {isScanning ? 'Decoding Consignment Code...' : 'Align Barcode / QR Label'}
          </Text>
          <View style={styles.btnRow}>
            <TouchableOpacity
              style={styles.scanBtn}
              onPress={() => simulateScan('SP')}
              disabled={isScanning}
            >
              <Text style={styles.scanBtnText}>Scan Speed Post</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.scanBtn, { backgroundColor: '#4338ca' }]}
              onPress={() => simulateScan('RP')}
              disabled={isScanning}
            >
              <Text style={styles.scanBtnText}>Scan Reg Post</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Manual Input & Fallback */}
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Manual tracking reference (e.g. SP829104812IN)"
          value={barcodeInput}
          onChangeText={setBarcodeInput}
          autoCapitalize="characters"
        />
        <TouchableOpacity
          style={[styles.scanBtn, { marginTop: 8, alignSelf: 'flex-start' }]}
          onPress={() => {
            const code = barcodeInput.trim().toUpperCase();
            if (!code) {
              setStatusMessage('Enter a tracking code or use Scan above.');
              return;
            }
            setExtractedData({
              trackingNumber: code,
              category: code.startsWith('RP') ? MailCategory.REGISTERED_POST : code.startsWith('CP') ? MailCategory.PARCEL : MailCategory.SPEED_POST,
              direction: MailDirection.INCOMING,
              recipientName: '',
              recipientAddress: '',
              destinationPincode: '600040',
              weightGrams: 150
            });
            setStaffVerified(false);
          }}
        >
          <Text style={styles.scanBtnText}>Prepare Manual Entry</Text>
        </TouchableOpacity>
      </View>

      {statusMessage && (
        <View style={styles.statusBox}>
          <Text style={styles.statusText}>{statusMessage}</Text>
        </View>
      )}

      {/* Extracted & Editable Fields */}
      {extractedData && (
        <View style={styles.reviewCard}>
          <Text style={styles.reviewTitle}>Verify & Edit Consignment Data</Text>

          <Text style={styles.label}>Tracking Code:</Text>
          <TextInput
            style={styles.input}
            value={extractedData.trackingNumber}
            onChangeText={(val) => setExtractedData({ ...extractedData, trackingNumber: val.toUpperCase() })}
            autoCapitalize="characters"
          />

          <Text style={styles.label}>Addressee / Recipient:</Text>
          <TextInput
            style={styles.input}
            placeholder="Recipient full name"
            value={extractedData.recipientName}
            onChangeText={(val) => setExtractedData({ ...extractedData, recipientName: val })}
          />

          <Text style={styles.label}>Delivery Address:</Text>
          <TextInput
            style={styles.input}
            placeholder="Street / Locality"
            value={extractedData.recipientAddress}
            onChangeText={(val) => setExtractedData({ ...extractedData, recipientAddress: val })}
          />

          <Text style={styles.label}>Destination Pincode:</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            maxLength={6}
            value={String(extractedData.destinationPincode || '')}
            onChangeText={(val) => setExtractedData({ ...extractedData, destinationPincode: val })}
          />

          <TouchableOpacity
            style={styles.verifyCheckbox}
            onPress={() => setStaffVerified(!staffVerified)}
          >
            <View style={[styles.box, staffVerified && styles.boxChecked]} />
            <Text style={styles.verifyText}>I have verified these details match physical label.</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.commitBtn, (!staffVerified || loading) && styles.commitBtnDisabled]}
            onPress={handleCommit}
            disabled={!staffVerified || loading}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.commitBtnText}>Commit Record (Online / Offline)</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
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
  cameraBox: {
    height: 180,
    backgroundColor: '#090d16',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    padding: 16,
  },
  reticle: {
    borderWidth: 2,
    borderColor: '#3b82f6',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    width: '100%',
  },
  reticleText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 8,
  },
  scanBtn: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  scanBtnText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 11,
  },
  inputRow: {
    marginBottom: 14,
  },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  statusBox: {
    backgroundColor: '#eff6ff',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    marginBottom: 14,
  },
  statusText: {
    fontSize: 12,
    color: '#1e40af',
    fontWeight: '600',
  },
  reviewCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  reviewTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 10,
  },
  label: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 6,
  },
  value: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0f172a',
  },
  valueMono: {
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'monospace',
    color: '#2563eb',
  },
  verifyCheckbox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 14,
  },
  box: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#94a3b8',
    marginRight: 8,
  },
  boxChecked: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  verifyText: {
    fontSize: 11,
    color: '#334155',
    flex: 1,
    fontWeight: '500',
  },
  commitBtn: {
    backgroundColor: '#059669',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  commitBtnDisabled: {
    opacity: 0.5,
  },
  commitBtnText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 13,
  },
});
