import axios, { AxiosError } from 'axios';
import { authStorage } from '@/lib/auth/storage';

export interface NormalizedError {
  status: number;
  message: string;
  error?: string;
  path?: string;
  timestamp?: string;
}

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

export const apiClient = axios.create({
  baseURL,
  timeout: 15000,
});

// Request Interceptor
apiClient.interceptors.request.use(
  (config) => {
    const token = authStorage.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Do not enforce JSON content-type if data is FormData
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error: AxiosError) => {
    const status = error.response?.status || 500;
    const data = error.response?.data as any;

    // Normalize error shape
    const normalizedError: NormalizedError = {
      status,
      message: 'Đã xảy ra lỗi kết nối.',
    };

    if (data) {
      // Spring Boot custom exception details (ApiErrorResponse)
      normalizedError.message = data.message || data.error || 'Yêu cầu không hợp lệ.';
      normalizedError.error = data.error;
      normalizedError.path = data.path;
      normalizedError.timestamp = data.timestamp;
    } else if (error.message) {
      normalizedError.message = error.message;
    }

    if (status === 401) {
      // Safe Session clearance & Redirect (avoid loop)
      authStorage.clearAll();
      const currentPath = window.location.pathname;
      if (currentPath !== '/login' && currentPath !== '/register' && currentPath !== '/forgot-password' && currentPath !== '/reset-password') {
        const returnUrl = encodeURIComponent(window.location.pathname + window.location.search);
        window.location.href = `/login?returnUrl=${returnUrl}`;
      }
    } else if (status === 403) {
      // Access Forbidden - do not log out, forward to /403 if full-page, or let page handle
      const currentPath = window.location.pathname;
      if (currentPath.startsWith('/admin') && currentPath !== '/403') {
        window.location.href = '/403';
      }
    }

    return Promise.reject(normalizedError);
  }
);
