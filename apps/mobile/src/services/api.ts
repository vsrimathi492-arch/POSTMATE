import AsyncStorage from '@react-native-async-storage/async-storage';
import { SyncBatchResponse } from '@postmate/shared';

const DEFAULT_API_BASE_URL = 'http://10.0.2.2:5000'; // Android emulator host loopback
const SERVER_URL_KEY = 'postmate_api_base_url';

export async function getApiBaseUrl(): Promise<string> {
  try {
    const saved = await AsyncStorage.getItem(SERVER_URL_KEY);
    return saved && saved.trim() ? saved.trim().replace(/\/+$/, '') : DEFAULT_API_BASE_URL;
  } catch {
    return DEFAULT_API_BASE_URL;
  }
}

export async function setApiBaseUrl(url: string): Promise<string> {
  const clean = url.trim().replace(/\/+$/, '') || DEFAULT_API_BASE_URL;
  await AsyncStorage.setItem(SERVER_URL_KEY, clean);
  return clean;
}

async function getHeaders(): Promise<Record<string, string>> {
  const token = await AsyncStorage.getItem('postmate_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

export const mobileApi = {
  login: async (employeeId: string, password = 'password123'): Promise<any> => {
    try {
      const baseUrl = await getApiBaseUrl();
      const res = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId, password })
      });
      return (await res.json()) as any;
    } catch {
      return { success: false, message: 'Network connection error. Check server URL.' };
    }
  },

  checkHealth: async (): Promise<boolean> => {
    try {
      const baseUrl = await getApiBaseUrl();
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 3000);
      const res = await fetch(`${baseUrl}/api/health`, { signal: controller.signal });
      clearTimeout(id);
      return res.ok;
    } catch {
      return false;
    }
  },

  getMyDeliveries: async (): Promise<any> => {
    const baseUrl = await getApiBaseUrl();
    const res = await fetch(`${baseUrl}/api/delivery/my`, {
      headers: await getHeaders()
    });
    return (await res.json()) as any;
  },

  scanBarcode: async (barcode: string): Promise<any> => {
    const baseUrl = await getApiBaseUrl();
    const res = await fetch(`${baseUrl}/api/scan/barcode`, {
      method: 'POST',
      headers: await getHeaders(),
      body: JSON.stringify({ barcode })
    });
    return (await res.json()) as any;
  },

  extractOcr: async (rawText?: string): Promise<any> => {
    const baseUrl = await getApiBaseUrl();
    const res = await fetch(`${baseUrl}/api/scan/ocr`, {
      method: 'POST',
      headers: await getHeaders(),
      body: JSON.stringify({ rawText })
    });
    return (await res.json()) as any;
  },

  createMail: async (dto: any): Promise<any> => {
    const baseUrl = await getApiBaseUrl();
    const res = await fetch(`${baseUrl}/api/mail`, {
      method: 'POST',
      headers: await getHeaders(),
      body: JSON.stringify(dto)
    });
    return (await res.json()) as any;
  },

  updateDeliveryStatus: async (mailId: string, dto: any): Promise<any> => {
    const baseUrl = await getApiBaseUrl();
    const res = await fetch(`${baseUrl}/api/delivery/status/${mailId}`, {
      method: 'PATCH',
      headers: await getHeaders(),
      body: JSON.stringify(dto)
    });
    return (await res.json()) as any;
  },

  searchEnquiry: async (trackingNumber: string): Promise<any> => {
    const baseUrl = await getApiBaseUrl();
    const res = await fetch(`${baseUrl}/api/enquiry/search?trackingNumber=${encodeURIComponent(trackingNumber)}`, {
      headers: await getHeaders()
    });
    return (await res.json()) as any;
  },

  syncBatch: async (batchRequest: any): Promise<SyncBatchResponse> => {
    const baseUrl = await getApiBaseUrl();
    const res = await fetch(`${baseUrl}/api/sync/batch`, {
      method: 'POST',
      headers: await getHeaders(),
      body: JSON.stringify(batchRequest)
    });
    return (await res.json()) as SyncBatchResponse;
  }
};
