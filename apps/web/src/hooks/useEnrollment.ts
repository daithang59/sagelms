import { useState, useCallback } from 'react';
import api from '@/lib/api';
import type { Enrollment, EnrollmentCheckResponse } from '@/types/course';

export function useEnrollment() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const enroll = useCallback(async (courseId: string) => {
    setLoading(true);
    setError(null);
    try {
      const enrollment = await api.post<Enrollment>(`/courses/${courseId}/enroll`);
      return enrollment;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to enroll';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const unenroll = useCallback(async (courseId: string) => {
    setLoading(true);
    setError(null);
    try {
      await api.delete(`/courses/${courseId}/enroll`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to unenroll';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const checkEnrollment = useCallback(async (courseId: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get<EnrollmentCheckResponse>(`/courses/${courseId}/enroll/check`);
      return response.enrolled;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to check enrollment';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getEnrollmentCheck = useCallback(async (courseId: string) => {
    setLoading(true);
    setError(null);
    try {
      return await api.get<EnrollmentCheckResponse>(`/courses/${courseId}/enroll/check`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to check enrollment';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getMyEnrollments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const enrollments = await api.get<Enrollment[]>('/courses/enrolled');
      return enrollments;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch enrollments';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getCourseStudents = useCallback(async (courseId: string) => {
    setLoading(true);
    setError(null);
    try {
      const enrollments = await api.get<Enrollment[]>(`/courses/${courseId}/students`);
      return enrollments;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch course students';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const completeCourse = useCallback(async (courseId: string) => {
    setLoading(true);
    setError(null);
    try {
      const enrollment = await api.post<Enrollment>(`/courses/${courseId}/complete`);
      return enrollment;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to complete course';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const dropCourseParticipant = useCallback(async (courseId: string, participantId: string, reason: string) => {
    setLoading(true);
    setError(null);
    try {
      await api.post<void>(`/courses/${courseId}/students/${participantId}/drop`, { reason });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to drop participant';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const approveCourseParticipant = useCallback(async (courseId: string, participantId: string) => {
    setLoading(true);
    setError(null);
    try {
      return await api.post<Enrollment>(`/courses/${courseId}/students/${participantId}/approve`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to approve participant';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const rejectCourseParticipant = useCallback(async (courseId: string, participantId: string, reason: string) => {
    setLoading(true);
    setError(null);
    try {
      return await api.post<Enrollment>(`/courses/${courseId}/students/${participantId}/reject`, { reason });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to reject participant';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    enroll,
    unenroll,
    checkEnrollment,
    getEnrollmentCheck,
    getMyEnrollments,
    getCourseStudents,
    completeCourse,
    dropCourseParticipant,
    approveCourseParticipant,
    rejectCourseParticipant,
  };
}
