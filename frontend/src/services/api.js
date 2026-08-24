import axios from 'axios';

const ACTIVE_BACKEND = 'https://hrms-backend-qj1f.onrender.com/api';
let rawUrl = (import.meta.env.VITE_API_URL || ACTIVE_BACKEND).trim();

if (rawUrl.includes('hrms-zhit.onrender.com')) {
  rawUrl = ACTIVE_BACKEND;
}

if (rawUrl.endsWith('/')) {
  rawUrl = rawUrl.slice(0, -1);
}
if (!rawUrl.endsWith('/api')) {
  rawUrl = `${rawUrl}/api`;
}
const API_BASE_URL = rawUrl;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to attach JWT token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('hrms_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle auth failures globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('hrms_token');
      localStorage.removeItem('hrms_user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
