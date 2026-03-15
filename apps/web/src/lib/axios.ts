import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// ── Request interceptor: attach JWT token ──
apiClient.interceptors.request.use(
  (config) => {
    const fullUrl = (config.baseURL || '') + (config.url || '');
    console.log('[API Request]', config.method?.toUpperCase(), fullUrl);
    const token = localStorage.getItem('accessToken');
    if (token) {
      console.log('[API Request] Token found, adding Authorization header');
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      console.log('[API Request] No token found in localStorage');
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ── Response interceptor: handle 401 + extract error messages ──
apiClient.interceptors.response.use(
  (response) => {
    const fullUrl = (response.config.baseURL || '') + (response.config.url || '');
    console.log('[API Response]', response.status, fullUrl);
    return response;
  },
  (error) => {
    const fullUrl = (error.config?.baseURL || '') + (error.config?.url || '');
    console.log('[API Error]', error.response?.status, fullUrl, error.message);
    if (error.response?.status === 401) {
      // Don't clear tokens if this is a login/register attempt (not yet authenticated)
      const url = error.config?.url || '';
      const isAuthEndpoint = url.includes('/auth/login') || url.includes('/auth/register');

      if (!isAuthEndpoint) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');

        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    }

    // Extract meaningful error message from response body
    const message = error.response?.data?.message || error.message || 'An error occurred.';
    return Promise.reject(new Error(message));
  },
);

export default apiClient;
