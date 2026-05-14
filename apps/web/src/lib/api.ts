import apiClient from './axios';

/**
 * Type-safe API helpers.
 * Usage:
 *   const courses = await api.get<Course[]>('/courses');
 *   const created = await api.post<Course>('/courses', { title: '...' });
 */
const api = {
  get: <T>(url: string) =>
    apiClient.get<T>(url).then((res) => res.data),

  post: <T>(url: string, data?: unknown) =>
    apiClient.post<T>(url, data).then((res) => res.data),

  put: <T>(url: string, data?: unknown) =>
    apiClient.put<T>(url, data).then((res) => res.data),

  patch: <T>(url: string, data?: unknown) =>
    apiClient.patch<T>(url, data).then((res) => res.data),

  delete: <T>(url: string, data?: unknown) =>
    apiClient.delete<T>(url, { data }).then((res) => res.data),
};

export default api;
