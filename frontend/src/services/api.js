import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle 401 Unauthorized
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token if expired or unauthorized
      if (!window.location.pathname.includes('/login')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login?expired=true';
      }
    }
    return Promise.reject(error);
  }
);

// Auth endpoints
export const authApi = {
  login: (username, password) => api.post('/auth/login', { username, password }),
  getProfile: () => api.get('/auth/me'),
};

// Employee endpoints
export const employeeApi = {
  getDashboard: () => api.get('/employee/vouchers/dashboard'),
  getMyVouchers: (params) => api.get('/employee/vouchers', { params }),
  createDraft: (data, isMultipart = false) => {
    if (isMultipart) {
      return api.post('/employee/vouchers', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    }
    return api.post('/employee/vouchers', data);
  },
  updateDraft: (id, data) => api.put(`/employee/vouchers/${id}`, data),
  deleteDraft: (id) => api.delete(`/employee/vouchers/${id}`),
  uploadSignature: (id, file) => {
    const formData = new FormData();
    formData.append('signature', file);
    return api.post(`/employee/vouchers/${id}/signature`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  submitVoucher: (id) => api.post(`/employee/vouchers/${id}/submit`),
};

// Director endpoints
export const directorApi = {
  getDashboard: () => api.get('/director/vouchers/dashboard'),
  getAllVouchers: (params) => api.get('/director/vouchers', { params }),
  getPendingVouchers: () => api.get('/director/vouchers/pending'),
  approveVoucher: (id, signatureFile) => {
    const formData = new FormData();
    formData.append('signature', signatureFile);
    return api.post(`/director/vouchers/${id}/approve`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  rejectVoucher: (id, rejectionReason) =>
    api.post(`/director/vouchers/${id}/reject`, { rejectionReason }),
};

// Accounts endpoints
export const accountsApi = {
  getDashboard: () => api.get('/accounts/vouchers/dashboard'),
  getAllVouchers: (params) => api.get('/accounts/vouchers', { params }),
};

// Common voucher endpoints
export const voucherApi = {
  getById: (id) => api.get(`/vouchers/${id}`),
  getSignatureUrl: (id, type) => `${API_BASE_URL}/vouchers/${id}/signatures/${type}`,
};

export default api;
