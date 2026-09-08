const API_BASE = '/api';

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: string;
  department?: string | null;
}

export function getToken(): string | null {
  return localStorage.getItem('hmis_token');
}

export function setToken(token: string) {
  localStorage.setItem('hmis_token', token);
}

export function getCurrentUser(): UserProfile | null {
  const userJson = localStorage.getItem('hmis_user');
  if (!userJson) return null;
  try {
    return JSON.parse(userJson);
  } catch {
    return null;
  }
}

export function setCurrentUser(user: UserProfile) {
  localStorage.setItem('hmis_user', JSON.stringify(user));
}

export function clearAuth() {
  localStorage.removeItem('hmis_token');
  localStorage.removeItem('hmis_user');
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(errorData.error || `HTTP ${response.status}`);
  }

  return response.json();
}

// -------------------------------------------------------------
// Specialized APIs
// -------------------------------------------------------------

export const authApi = {
  login: async (identifier: string, password: string) => {
    const res = await request<{ token: string; user: UserProfile }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: identifier, username: identifier, password }),
    });
    setToken(res.token);
    setCurrentUser(res.user);
    return res;
  },
  getProfile: () => request<UserProfile>('/auth/me'),
  switchRole: async (role: string) => {
    const res = await request<{ token: string; user: UserProfile }>('/auth/switch-role', {
      method: 'POST',
      body: JSON.stringify({ role }),
    });
    setToken(res.token);
    setCurrentUser(res.user);
    return res;
  },
};

export const procurementApi = {
  getStats: () => request<any>('/procurement/stats'),
  getRequisitions: () => request<any[]>('/procurement/requisitions'),
  createRequisition: (data: any) =>
    request<any>('/procurement/requisitions', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateRequisitionStatus: (id: string, status: string) =>
    request<any>(`/procurement/requisitions/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }),
  getPurchaseOrders: () => request<any[]>('/procurement/purchase-orders'),
  createPurchaseOrder: (data: any) =>
    request<any>('/procurement/purchase-orders', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getSuppliers: () => request<any[]>('/procurement/suppliers'),
  createSupplier: (data: any) =>
    request<any>('/procurement/suppliers', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

export const accountsApi = {
  getStats: () => request<any>('/accounts/stats'),
  getJournals: () => request<any[]>('/accounts/journals'),
  createJournal: (data: any) =>
    request<any>('/accounts/journals', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getTrialBalance: () => request<any>('/accounts/trial-balance'),
};

export const hrApi = {
  getStats: () => request<any>('/hr/stats'),
  getEmployees: () => request<any[]>('/hr/employees'),
  createEmployee: (data: any) =>
    request<any>('/hr/employees', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getLeaves: () => request<any[]>('/hr/leaves'),
  createLeave: (data: any) =>
    request<any>('/hr/leaves', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateLeaveStatus: (id: string, status: string) =>
    request<any>(`/hr/leaves/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }),
  getPayroll: () => request<any[]>('/hr/payroll'),
  processPayroll: (data: { month: number; year: number }) =>
    request<any>('/hr/payroll/process', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

export const patientApi = {
  search: (q = '', page = 1) => request<any>(`/patients?q=${encodeURIComponent(q)}&page=${page}`),
  getById: (id: string) => request<any>(`/patients/${id}`),
  register: (patientData: any) =>
    request<any>('/patients', {
      method: 'POST',
      body: JSON.stringify(patientData),
    }),
};

export const queueApi = {
  getDepartmentQueue: (dept: string) => request<any[]>(`/queue/${dept}`),
  call: (id: string) => request<any>(`/queue/${id}/call`, { method: 'POST' }),
  start: (id: string) => request<any>(`/queue/${id}/start`, { method: 'POST' }),
  route: (id: string, nextDepartment: string, priority = 1, encounterStatus?: string) =>
    request<any>(`/queue/${id}/route`, {
      method: 'POST',
      body: JSON.stringify({ nextDepartment, priority, encounterStatus }),
    }),
};

export const triageApi = {
  recordVitals: (data: any) =>
    request<any>('/triage', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

export const clinicalApi = {
  recordConsultation: (data: any) =>
    request<any>('/clinical/consultation', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

export const labApi = {
  getTests: () => request<any[]>('/lab/tests'),
  getOrders: (status?: string) => request<any[]>(`/lab/orders${status ? `?status=${status}` : ''}`),
  recordResults: (orderId: string, results: any[]) =>
    request<any>(`/lab/orders/${orderId}/results`, {
      method: 'POST',
      body: JSON.stringify({ results }),
    }),
};

export const pharmacyApi = {
  getInventory: () => request<any[]>('/pharmacy/inventory'),
  getPrescriptions: (status?: string) =>
    request<any[]>(`/pharmacy/prescriptions${status ? `?status=${status}` : ''}`),
  dispense: (prescriptionId: string, items: any[]) =>
    request<any>('/pharmacy/dispense', {
      method: 'POST',
      body: JSON.stringify({ prescriptionId, items }),
    }),
};

export const billingApi = {
  getInvoices: (status?: string) => request<any[]>(`/billing/invoices${status ? `?status=${status}` : ''}`),
  getInvoice: (id: string) => request<any>(`/billing/invoices/${id}`),
  recordPayment: (paymentData: any) =>
    request<any>('/billing/payments', {
      method: 'POST',
      body: JSON.stringify(paymentData),
    }),
};

export const inpatientApi = {
  getWards: () => request<any[]>('/inpatient/wards'),
  recordNursingNote: (admissionId: string, note: string) =>
    request<any>('/inpatient/nursing-note', {
      method: 'POST',
      body: JSON.stringify({ admissionId, note }),
    }),
  recordDrugAdmin: (data: any) =>
    request<any>('/inpatient/drug-admin', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  discharge: (admissionId: string, dischargeNotes: string) =>
    request<any>('/inpatient/discharge', {
      method: 'POST',
      body: JSON.stringify({ admissionId, dischargeNotes }),
    }),
};

export const shaApi = {
  verifyEligibility: (idNumber: string, memberNumber?: string) =>
    request<any>('/sha/verify-eligibility', {
      method: 'POST',
      body: JSON.stringify({ idNumber, memberNumber }),
    }),
  submitClaim: (claimData: any) =>
    request<any>('/sha/claims', {
      method: 'POST',
      body: JSON.stringify(claimData),
    }),
  getClaims: () => request<any[]>('/sha/claims'),
};

export const adminApi = {
  getStats: () => request<any>('/admin/stats'),
  getUsers: () => request<any[]>('/admin/users'),
  createUser: (userData: any) =>
    request<any>('/admin/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    }),
  getAuditLogs: () => request<any[]>('/admin/audit-logs'),
};
