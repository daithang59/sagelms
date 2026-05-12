import { useState, useCallback } from 'react';
import api from '@/lib/api';
import type { Course, CourseRequest, CourseListResponse } from '@/types/course';

export function useCourses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCourses = useCallback(async (params?: {
    page?: number;
    size?: number;
    search?: string;
    status?: string;
    category?: string;
  }) => {
    setLoading(true);
    setError(null);
    try {
      const queryParams = new URLSearchParams();
      if (params?.page !== undefined) queryParams.set('page', String(params.page));
      if (params?.size !== undefined) queryParams.set('size', String(params.size));
      if (params?.search) queryParams.set('search', params.search);
      if (params?.status) queryParams.set('status', params.status);
      if (params?.category) queryParams.set('category', params.category);

      const query = queryParams.toString();
      const url = `/courses${query ? `?${query}` : ''}`;

      console.log('[useCourses] Fetching from:', url);
      const response = await api.get<CourseListResponse>(url);
      console.log('[useCourses] Response:', response);
      setCourses(response.content || []);
      return response;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch courses';
      setError(message);
      console.error('[useCourses] Error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCourse = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      console.log('[useCourses] fetchCourse - Calling API with course ID:', id);
      const url = `/courses/${id}`;
      console.log('[useCourses] fetchCourse - URL:', url);
      const course = await api.get<Course>(url);
      console.log('[useCourses] fetchCourse - Response:', course);
      return course;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch course';
      setError(message);
      console.error('[useCourses] fetchCourse error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const createCourse = useCallback(async (data: CourseRequest) => {
    setLoading(true);
    setError(null);
    try {
      const course = await api.post<Course>('/courses', data);
      setCourses(prev => [course, ...prev]);
      return course;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create course';
      setError(message);
      console.error('createCourse error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateCourse = useCallback(async (id: string, data: CourseRequest) => {
    setLoading(true);
    setError(null);
    try {
      const course = await api.put<Course>(`/courses/${id}`, data);
      setCourses(prev => prev.map(c => c.id === id ? course : c));
      return course;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update course';
      setError(message);
      console.error('updateCourse error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteCourse = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      await api.delete(`/courses/${id}`);
      setCourses(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete course';
      setError(message);
      console.error('deleteCourse error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMyCourses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get<Course[]>('/courses/my-courses');
      setCourses(response || []);
      return response;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch my courses';
      setError(message);
      console.error('fetchMyCourses error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    courses,
    loading,
    error,
    fetchCourses,
    fetchCourse,
    fetchMyCourses,
    createCourse,
    updateCourse,
    deleteCourse,
  };
}
