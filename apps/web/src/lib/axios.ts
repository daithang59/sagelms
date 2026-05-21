import axios from 'axios';
import type { AxiosError, InternalAxiosRequestConfig } from 'axios';

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

function toApiError(error: AxiosError, fallback = 'An error occurred.') {
  const data = error.response?.data as {
    message?: string;
    code?: string;
    detail?: string | { message?: string; code?: string };
  } | undefined;
  const detail = data?.detail;
  const message = typeof detail === 'object'
    ? detail.message
    : typeof detail === 'string'
      ? detail
      : data?.message || error.message || fallback;
  const code = typeof detail === 'object' ? detail.code : data?.code;
  return Object.assign(new Error(message || fallback), { code });
}

// ── Request interceptor: attach JWT token ──
apiClient.interceptors.request.use(
  (config) => {
    const url = config.url || '';
    const isAuth = url.includes('/auth/login') || url.includes('/auth/register') || url.includes('/auth/refresh');
    const token = localStorage.getItem('accessToken');
    if (token && !isAuth) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error),
);

// ── Response interceptor: handle 401 + refresh token ──
let isRefreshing = false;
let refreshQueue: Array<{ resolve: (token: string) => void; reject: (err: Error) => void }> = [];

type RetryableRequestConfig = InternalAxiosRequestConfig & { __retry?: boolean };

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
    const config = error.config as RetryableRequestConfig | undefined;
    if (!config || config.__retry) {
      return Promise.reject(toApiError(error));
    }

    const url = config.url || '';
    const isAuth = url.includes('/auth/login') || url.includes('/auth/register') || url.includes('/auth/refresh');

    if (error.response?.status === 401 && !isAuth) {
      // Queue requests while refresh is in flight
      if (isRefreshing) {
        return new Promise<string>((resolve, reject) => {
          refreshQueue.push({ resolve, reject });
        }).then((token) => {
          config.__retry = true;
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
        return Promise.reject(toApiError(error, 'Session expired. Please login again.'));
      }

      try {
        // Use separate client (no interceptors) to avoid re-entry
        const res = await refreshClient.post('/auth/refresh', { refreshToken });
        const newAccessToken: string = res.data.accessToken;
        localStorage.setItem('accessToken', newAccessToken);
        if (res.data.refreshToken) localStorage.setItem('refreshToken', res.data.refreshToken);

        drainQueue(newAccessToken);
        isRefreshing = false;

        config.__retry = true;
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

    return Promise.reject(toApiError(error));
  },
);

export default apiClient;
