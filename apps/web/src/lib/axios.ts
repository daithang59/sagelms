import axios from 'axios';
import type { AxiosError } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1';

// Separate axios instance for refresh — no interceptors, avoids re-entry
const refreshClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// ── Request interceptor: attach JWT token ──
apiClient.interceptors.request.use(
  (config) => {
    const fullUrl = (config.baseURL || '') + (config.url || '');
    const token = localStorage.getItem('accessToken');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error),
);

// ── Response interceptor: handle 401 + refresh token ──
let isRefreshing = false;
let refreshQueue: Array<{ resolve: (token: string) => void; reject: (err: Error) => void }> = [];

const drainQueue = (token: string, err?: Error) => {
  refreshQueue.forEach(({ resolve, reject }) => {
    if (err) reject(err);
    else resolve(token);
  });
  refreshQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config;
    if (!config || (config as any).__retry) {
      const msg = (error.response?.data as any)?.message || error.message || 'An error occurred.';
      return Promise.reject(new Error(msg));
    }

    const url = config.url || '';
    const isAuth = url.includes('/auth/login') || url.includes('/auth/register') || url.includes('/auth/refresh');

    if (error.response?.status === 401 && !isAuth) {
      // Queue requests while refresh is in flight
      if (isRefreshing) {
        return new Promise<string>((resolve, reject) => {
          refreshQueue.push({ resolve, reject });
        }).then((token) => {
          (config as any).__retry = true;
          config.headers.Authorization = `Bearer ${token}`;
          return apiClient(config);
        });
      }

      isRefreshing = true;
      const refreshToken = localStorage.getItem('refreshToken');

      if (!refreshToken) {
        isRefreshing = false;
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        if (window.location.pathname !== '/login') window.location.href = '/login';
        const msg = (error.response?.data as any)?.message || 'Session expired. Please login again.';
        return Promise.reject(new Error(msg));
      }

      try {
        // Use separate client (no interceptors) to avoid re-entry
        const res = await refreshClient.post('/auth/refresh', { refreshToken });
        const newAccessToken: string = res.data.accessToken;
        localStorage.setItem('accessToken', newAccessToken);
        if (res.data.refreshToken) localStorage.setItem('refreshToken', res.data.refreshToken);

        drainQueue(newAccessToken);
        isRefreshing = false;

        (config as any).__retry = true;
        config.headers.Authorization = `Bearer ${newAccessToken}`;
        return apiClient(config);
      } catch (refreshError) {
        const err = refreshError instanceof Error ? refreshError : new Error(String(refreshError));
        drainQueue('', err);
        isRefreshing = false;
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        if (window.location.pathname !== '/login') window.location.href = '/login';
        return Promise.reject(new Error(err.message || 'Session expired. Please login again.'));
      }
    }

    const msg = (error.response?.data as any)?.message || error.message || 'An error occurred.';
    return Promise.reject(new Error(msg));
  },
);

export default apiClient;
