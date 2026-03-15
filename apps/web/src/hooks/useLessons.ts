import { useState, useCallback } from 'react';
import api from '@/lib/api';
import type { Lesson, LessonRequest } from '@/types/lesson';

export function useLessons() {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLessonsByCourse = useCallback(async (courseId: string, publishedOnly = false) => {
    setLoading(true);
    setError(null);
    try {
      const query = publishedOnly ? '?published=true' : '';
      const url = `/courses/${courseId}/lessons${query}`;
      console.log('[useLessons] fetchLessonsByCourse - Calling API with courseId:', courseId, 'url:', url);
      const response = await api.get<Lesson[]>(url);
      console.log('[useLessons] fetchLessonsByCourse - Response:', response);
      setLessons(response);
      return response;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch lessons';
      setError(message);
      console.error('[useLessons] fetchLessonsByCourse error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchLesson = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const lesson = await api.get<Lesson>(`/lessons/${id}`);
      return lesson;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch lesson';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const createLesson = useCallback(async (courseId: string, data: LessonRequest) => {
    setLoading(true);
    setError(null);
    try {
      const lesson = await api.post<Lesson>(`/courses/${courseId}/lessons`, data);
      setLessons(prev => [...prev, lesson]);
      return lesson;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create lesson';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateLesson = useCallback(async (id: string, data: LessonRequest) => {
    setLoading(true);
    setError(null);
    try {
      const lesson = await api.put<Lesson>(`/lessons/${id}`, data);
      setLessons(prev => prev.map(l => l.id === id ? lesson : l));
      return lesson;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update lesson';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteLesson = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      await api.delete(`/lessons/${id}`);
      setLessons(prev => prev.filter(l => l.id !== id));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete lesson';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const publishLesson = useCallback(async (id: string, publish: boolean) => {
    setLoading(true);
    setError(null);
    try {
      const lesson = await api.patch<Lesson>(`/lessons/${id}/publish?publish=${publish}`);
      setLessons(prev => prev.map(l => l.id === id ? lesson : l));
      return lesson;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to publish lesson';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    lessons,
    loading,
    error,
    fetchLessonsByCourse,
    fetchLesson,
    createLesson,
    updateLesson,
    deleteLesson,
    publishLesson,
  };
}
