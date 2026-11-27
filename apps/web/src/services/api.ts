import {
  CreateMailDto,
  MailFilterDto,
  CreateSortingBatchDto,
  UpdateDeliveryStatusDto,
  CreateTransactionDto,
  ReconcileCashbookDto,
  CreateEnquiryDto
} from '@postmate/shared';

// In production (Vercel), VITE_API_BASE_URL points to the hosted Render backend URL.
// In development, it stays empty and the Vite proxy routes /api calls to localhost:5000.
export const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').trim().replace(/\/+$/, '');

function getHeaders() {
  const token = localStorage.getItem('postmate_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

export function apiFetch(path: string, init?: RequestInit) {
  return fetch(`${API_BASE}${path}`, init);
}

export const api = {
  // Analytics & Dashboard
  getDashboardMetrics: async () => {
    const res = await apiFetch('/api/analytics/dashboard', { headers: getHeaders() });
    return res.json();
  },

  // Mail
  getMailList: async (filter?: MailFilterDto) => {
    const params = new URLSearchParams();
    if (filter?.direction) params.append('direction', filter.direction);
    if (filter?.category) params.append('category', filter.category);
    if (filter?.status) params.append('status', filter.status);
    if (filter?.search) params.append('search', filter.search);
    if (filter?.startDate) params.append('startDate', filter.startDate);
    if (filter?.endDate) params.append('endDate', filter.endDate);
    if (filter?.page) params.append('page', filter.page.toString());
    if (filter?.limit) params.append('limit', filter.limit.toString());

    const res = await apiFetch(`/api/mail?${params.toString()}`, { headers: getHeaders() });
    return res.json();
  },

  getMailById: async (id: string) => {
    const res = await apiFetch(`/api/mail/${id}`, { headers: getHeaders() });
    return res.json();
  },

  getMailSummary: async () => {
    const res = await apiFetch('/api/mail/summary', { headers: getHeaders() });
    return res.json();
  },

  createMail: async (dto: CreateMailDto) => {
    const res = await apiFetch('/api/mail', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(dto)
    });
    return res.json();
  },

  updateMail: async (id: string, updates: Record<string, any>) => {
    const res = await apiFetch(`/api/mail/${id}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(updates)
    });
    return res.json();
  },

  // Scanning & OCR
  scanBarcode: async (barcode: string) => {
    const res = await apiFetch('/api/scan/barcode', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ barcode })
    });
    return res.json();
  },

  extractOcr: async (rawText?: string) => {
    const res = await apiFetch('/api/scan/ocr', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ rawText })
    });
    return res.json();
  },

  // Sorting
  getSortingSuggestions: async (groupBy: 'destination' | 'category' = 'destination') => {
    const res = await apiFetch(`/api/sorting/suggestions?groupBy=${groupBy}`, { headers: getHeaders() });
    return res.json();
  },

  getSortingBatches: async () => {
    const res = await apiFetch('/api/sorting/batches', { headers: getHeaders() });
    return res.json();
  },

  createSortingBatch: async (dto: CreateSortingBatchDto) => {
    const res = await apiFetch('/api/sorting/batches', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(dto)
    });
    return res.json();
  },

  updateSortingBatch: async (id: string, updates: { status?: string; verifiedItems?: number; notes?: string }) => {
    const res = await apiFetch(`/api/sorting/batches/${id}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(updates)
    });
    return res.json();
  },

  // Delivery
  getDeliveries: async () => {
    const res = await apiFetch('/api/delivery', { headers: getHeaders() });
    return res.json();
  },

  getMyDeliveries: async (status?: string) => {
    const url = status ? `/api/delivery/my?status=${status}` : '/api/delivery/my';
    const res = await apiFetch(url, { headers: getHeaders() });
    return res.json();
  },

  getDeliverySummary: async () => {
    const res = await apiFetch('/api/delivery/summary', { headers: getHeaders() });
    return res.json();
  },

  assignDelivery: async (mailId: string, staffId: string) => {
    const res = await apiFetch('/api/delivery/assign', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ mailId, staffId })
    });
    return res.json();
  },

  updateDeliveryStatus: async (mailId: string, dto: Partial<UpdateDeliveryStatusDto>) => {
    const res = await apiFetch(`/api/delivery/status/${mailId}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(dto)
    });
    return res.json();
  },

  // Staff
  getStaffList: async () => {
    const res = await apiFetch('/api/staff', { headers: getHeaders() });
    return res.json();
  },

  getWorkloadSuggestions: async () => {
    const res = await apiFetch('/api/staff/workload-suggestions', { headers: getHeaders() });
    return res.json();
  },

  reassignStaffTasks: async (fromStaffId: string, toStaffId: string, count = 2) => {
    const res = await apiFetch('/api/staff/reassign', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ fromStaffId, toStaffId, count })
    });
    return res.json();
  },

  toggleStaffAvailability: async (id: string, isActive: boolean) => {
    const res = await apiFetch(`/api/staff/${id}/availability`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ isActive })
    });
    return res.json();
  },

  // Cashbook
  getCashTransactions: async (date?: string) => {
    const url = date ? `/api/cashbook/transactions?date=${date}` : '/api/cashbook/transactions';
    const res = await apiFetch(url, { headers: getHeaders() });
    return res.json();
  },

  getCashBalance: async (date?: string) => {
    const url = date ? `/api/cashbook/balance?date=${date}` : '/api/cashbook/balance';
    const res = await apiFetch(url, { headers: getHeaders() });
    return res.json();
  },

  createTransaction: async (dto: CreateTransactionDto) => {
    const res = await apiFetch('/api/cashbook/transactions', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(dto)
    });
    return res.json();
  },

  verifyTransaction: async (id: string) => {
    const res = await apiFetch(`/api/cashbook/transactions/${id}/verify`, {
      method: 'PATCH',
      headers: getHeaders()
    });
    return res.json();
  },

  reconcileCash: async (dto: ReconcileCashbookDto) => {
    const res = await apiFetch('/api/cashbook/reconcile', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(dto)
    });
    return res.json();
  },

  // Customer Enquiry
  searchEnquiry: async (trackingNumber: string) => {
    const res = await apiFetch(`/api/enquiry/search?trackingNumber=${encodeURIComponent(trackingNumber)}`, {
      headers: getHeaders()
    });
    return res.json();
  },

  getEnquiries: async () => {
    const res = await apiFetch('/api/enquiry', { headers: getHeaders() });
    return res.json();
  },

  createEnquiry: async (dto: CreateEnquiryDto) => {
    const res = await apiFetch('/api/enquiry', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(dto)
    });
    return res.json();
  },

  updateEnquiryResolution: async (id: string, resolutionStatus: string, resolutionNotes?: string) => {
    const res = await apiFetch(`/api/enquiry/${id}/resolution`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ resolutionStatus, resolutionNotes })
    });
    return res.json();
  },

  // Reports
  getReports: async () => {
    const res = await apiFetch('/api/reports', { headers: getHeaders() });
    return res.json();
  },

  generateReport: async (date?: string, reportType?: string) => {
    const res = await apiFetch('/api/reports/generate', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ date, reportType })
    });
    return res.json();
  },

  approveReport: async (id: string) => {
    const res = await apiFetch(`/api/reports/${id}/approve`, {
      method: 'PATCH',
      headers: getHeaders()
    });
    return res.json();
  },

  downloadReportPdf: async (id: string, filename = 'POSTMATE_Report.pdf') => {
    const token = localStorage.getItem('postmate_token');
    const res = await apiFetch(`/api/reports/${id}/pdf`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    if (!res.ok) {
      throw new Error(`Failed to download PDF (${res.status})`);
    }
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  },

  // Notifications
  getNotifications: async () => {
    const res = await apiFetch('/api/notifications', { headers: getHeaders() });
    return res.json();
  },

  markNotificationRead: async (id: string) => {
    const res = await apiFetch(`/api/notifications/${id}/read`, {
      method: 'PATCH',
      headers: getHeaders()
    });
    return res.json();
  },

  markAllNotificationsRead: async () => {
    const res = await apiFetch('/api/notifications/read-all', {
      method: 'POST',
      headers: getHeaders()
    });
    return res.json();
  },

  // Admin
  getOffices: async () => {
    const res = await apiFetch('/api/admin/offices', { headers: getHeaders() });
    return res.json();
  },

  createOffice: async (dto: Record<string, any>) => {
    const res = await apiFetch('/api/admin/offices', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(dto)
    });
    return res.json();
  },

  getUsers: async () => {
    const res = await apiFetch('/api/admin/users', { headers: getHeaders() });
    return res.json();
  },

  createUser: async (dto: Record<string, any>) => {
    const res = await apiFetch('/api/admin/users', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(dto)
    });
    return res.json();
  },

  updateUser: async (id: string, updates: Record<string, any>) => {
    const res = await apiFetch(`/api/admin/users/${id}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(updates)
    });
    return res.json();
  },

  getAuditLogs: async (module?: string) => {
    const url = module ? `/api/admin/audit-logs?module=${module}` : '/api/admin/audit-logs';
    const res = await apiFetch(url, { headers: getHeaders() });
    return res.json();
  },

  getSystemStatus: async () => {
    const res = await apiFetch('/api/admin/system-status', { headers: getHeaders() });
    return res.json();
  }
};
