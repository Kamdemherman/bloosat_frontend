import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api',
  withCredentials: true,
  headers: { Accept: 'application/json' },
});

// Add request interceptor to handle FormData
api.interceptors.request.use(
  (config) => {
    // Only set Content-Type for non-FormData requests
    if (!(config.data instanceof FormData)) {
      config.headers['Content-Type'] = 'application/json';
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('bss_token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;

export const clientsApi = {
  list:       (params) => api.get('/clients', { params }),
  get:        (id) => api.get(`/clients/${id}`),
  create:     (data) => api.post('/clients', data),
  update:     (id, data) => api.put(`/clients/${id}`, data),
  delete:     (id) => api.delete(`/clients/${id}`),
  deactivate: (id) => api.patch(`/clients/${id}/deactivate`),
  suspend:    (id) => api.patch(`/clients/${id}/suspend`),
  unsuspend:  (id) => api.patch(`/clients/${id}/unsuspend`),
};

export const invoicesApi = {
  list:          (params) => api.get('/invoices', { params }),
  get:           (id) => api.get(`/invoices/${id}`),
  create:        (data) => api.post('/invoices', data),
  update:        (id, data) => api.put(`/invoices/${id}`, data),
  delete:        (id) => api.delete(`/invoices/${id}`),
  validate:      (id) => api.patch(`/invoices/${id}/validate`),
  unlockRequest: (id, reason) => api.patch(`/invoices/${id}/unlock-request`, { reason }),
  approveUnlock: (id) => api.patch(`/invoices/${id}/approve-unlock`),
  createSub:     (id, data) => api.post(`/invoices/${id}/subscription`, data),
};

export const encaissementsApi = {
  list:        (params) => api.get('/encaissements', { params }),
  create:      (formData) => api.post('/encaissements', formData),
  cancel:      (id) => api.patch(`/encaissements/${id}/cancel`),
  sendReceipt: (id) => api.post(`/encaissements/${id}/send-receipt`),
  dailyTotal:  () => api.get('/encaissements/daily-total'),
};

// Additional APIs for encaissement form
export const formDataApi = {
  clients:    () => api.get('/clients?per_page=1000').then(r => r.data.data),
  invoices:   () => api.get('/invoices?per_page=1000').then(r => r.data.data),
};

export const productsApi = {
  list:    (params) => api.get('/products', { params }),
  create:  (data) => api.post('/products', data),
  update:  (id, data) => api.put(`/products/${id}`, data),
  delete:  (id) => api.delete(`/products/${id}`),
  restore: (id) => api.patch(`/products/${id}/restore`),
};

export const stockApi = {
  movements:   (params) => api.get('/stock/movements', { params }),
  addMovement: (data) => api.post('/stock/movements', data),
  delete:      (id) => api.delete(`/stock/movements/${id}`),
  levels:      (params) => api.get('/stock/levels', { params }),
  warehouses:  () => api.get('/stock/warehouses'),
};

export const usersApi = {
  list:   () => api.get('/users'),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
};

export const logsApi = {
  list: (params) => api.get('/logs', { params }),
};

// Sites API
export const sitesApi = {
  byClient: (clientId) => api.get(`/clients/${clientId}/sites`),
  list:     (params)   => api.get('/sites', { params }),
  get:      (id)       => api.get(`/sites/${id}`),
  create:   (data)     => api.post('/sites', data),
  update:   (id, data) => api.put(`/sites/${id}`, data),
  deactivate: (id)     => api.delete(`/sites/${id}`),
  restore:  (id)       => api.patch(`/sites/${id}/restore`),
};

// Settings API
export const settingsApi = {
  list:       () => api.get('/settings'),
  update:     (settings) => api.put('/settings', { settings }),
  uploadLogo: (file) => {
    const fd = new FormData();
    fd.append('logo', file);
    return api.post('/settings/logo', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
};
