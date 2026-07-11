import axios from 'axios';
import { supabase } from './supabase';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to automatically attach authorization header
api.interceptors.request.use(
  async (config) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      config.headers.Authorization = `Bearer ${session.access_token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// API Endpoints
export const authApi = {
  getMe: async () => {
    const { data } = await api.get('/auth/me');
    return data;
  },
  activateKey: async (key: string) => {
    const { data } = await api.post('/auth/activate', { key });
    return data;
  },
  getPublicSettings: async () => {
    const { data } = await axios.get(`${API_URL}/settings/public`);
    return data;
  }
};

export const documentApi = {
  generate: async (formData: FormData) => {
    const { data } = await api.post('/documents/generate', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return data;
  },
  getMyTests: async () => {
    const { data } = await api.get('/documents/my-tests');
    return data;
  },
  getTest: async (id: string) => {
    const { data } = await api.get(`/documents/${id}`);
    return data;
  },
  getRenderUrl: (id: string, print = false) => {
    return `${API_URL}/documents/${id}/render${print ? '?print=true' : ''}`;
  },
  trackDownload: async (id: string) => {
    const { data } = await api.post(`/documents/${id}/download`);
    return data;
  }
};

export const verifyApi = {
  verify: async (id: string) => {
    const { data } = await axios.get(`${API_URL}/verify/${id}`);
    return data;
  }
};

export const adminApi = {
  getAnalytics: async () => {
    const { data } = await api.get('/admin/analytics');
    return data;
  },
  getUsers: async (search = '') => {
    const { data } = await api.get(`/admin/users?search=${encodeURIComponent(search)}`);
    return data;
  },
  updateUserStatus: async (id: string, status: 'active' | 'suspended') => {
    const { data } = await api.patch(`/admin/users/${id}/status`, { status });
    return data;
  },
  resetUserPassword: async (id: string, password: string) => {
    const { data } = await api.post(`/admin/users/${id}/reset-password`, { password });
    return data;
  },
  deleteUser: async (id: string) => {
    const { data } = await api.delete(`/admin/users/${id}`);
    return data;
  },
  generateKeys: async (count: number) => {
    const { data } = await api.post('/admin/keys/generate', { count });
    return data;
  },
  getKeys: async (search = '', filter = 'all') => {
    const { data } = await api.get(`/admin/keys?search=${encodeURIComponent(search)}&filter=${filter}`);
    return data;
  },
  deleteKey: async (id: string) => {
    const { data } = await api.delete(`/admin/keys/${id}`);
    return data;
  },
  getTests: async (search = '') => {
    const { data } = await api.get(`/admin/tests?search=${encodeURIComponent(search)}`);
    return data;
  },
  deleteTest: async (id: string) => {
    const { data } = await api.delete(`/admin/tests/${id}`);
    return data;
  },
  getTestHistory: async (id: string) => {
    const { data } = await api.get(`/admin/tests/${id}/history`);
    return data;
  },
  getSettings: async () => {
    const { data } = await api.get('/admin/settings');
    return data;
  },
  updateSettings: async (telegram_username: string) => {
    const { data } = await api.post('/admin/settings', { telegram_username });
    return data;
  }
};

export default api;
