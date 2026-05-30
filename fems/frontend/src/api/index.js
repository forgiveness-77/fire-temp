import axios from 'axios';

const TOKEN_KEY = 'fems_token';

const api = axios.create({ baseURL: '/api' });

export function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setAuthToken(token) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  }
}

export function clearAuthToken() {
  localStorage.removeItem(TOKEN_KEY);
  delete api.defaults.headers.common.Authorization;
}

const token = getStoredToken();
if (token) setAuthToken(token);

let onUnauthorized = null;
export function setUnauthorizedHandler(handler) {
  onUnauthorized = handler;
}

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && !err.config?.url?.includes('/auth/login')) {
      clearAuthToken();
      onUnauthorized?.();
    }
    return Promise.reject(err);
  }
);

export const authApi = {
  login: (data) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
};

export const usersApi = {
  getAll: () => api.get('/users'),
  getById: (id) => api.get(`/users/${id}`),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
};

export const customersApi = {
  getAll: (params) => api.get('/customers', { params }),
  getById: (id) => api.get(`/customers/${id}`),
  create: (data) => api.post('/customers', data),
  update: (id, data) => api.put(`/customers/${id}`, data),
  delete: (id) => api.delete(`/customers/${id}`),
};

export const extinguishersApi = {
  getAll: (params) => api.get('/extinguishers', { params }),
  getStats: () => api.get('/extinguishers/stats'),
  getById: (id) => api.get(`/extinguishers/${id}`),
  create: (data) => api.post('/extinguishers', data),
  update: (id, data) => api.put(`/extinguishers/${id}`, data),
  delete: (id) => api.delete(`/extinguishers/${id}`),
};

export const notificationsApi = {
  getAll: (params) => api.get('/notifications', { params }),
  markSeen: (id) => api.patch(`/notifications/${id}/seen`),
  markAllSeen: (data) => api.patch('/notifications/seen-all', data),
  triggerCheck: () => api.post('/notifications/trigger-check'),
};

export const escalationsApi = {
  getAll: (params) => api.get('/escalations', { params }),
  updateStatus: (id, data) => api.patch(`/escalations/${id}/status`, data),
  delete: (id) => api.delete(`/escalations/${id}`),
};
