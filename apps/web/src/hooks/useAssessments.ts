import { useCallback, useState } from 'react';
import api from '@/lib/api';
import type {
  Assessment,
  AssessmentDetailResponse,
  AssessmentListResponse,
  AssessmentQuestion,
  AssessmentQuestionRequest,
  AssessmentQuestionSet,
  AssessmentQuestionSetDetailResponse,
  AssessmentQuestionSetRequest,
  AssessmentRequest,
} from '@/types/assessment';

export function useAssessments() {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAssessments = useCallback(async (courseId: string, params?: { search?: string; category?: string; page?: number; size?: number }) => {
    setLoading(true);
    setError(null);
    try {
      const queryParams = new URLSearchParams();
      if (params?.search) queryParams.set('search', params.search);
      if (params?.category) queryParams.set('category', params.category);
      if (params?.page !== undefined) queryParams.set('page', String(params.page));
      if (params?.size !== undefined) queryParams.set('size', String(params.size));
      const query = queryParams.toString();
      const response = await api.get<AssessmentListResponse>(`/courses/${courseId}/assessments${query ? `?${query}` : ''}`);
      setAssessments(response.content || []);
      return response;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch assessments';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAssessment = useCallback(async (courseId: string, id: string) => {
    setLoading(true);
    setError(null);
    try {
      return await api.get<AssessmentDetailResponse>(`/courses/${courseId}/assessments/${id}`);
    } finally {
      setLoading(false);
    }
  }, []);

  const createAssessment = useCallback(async (courseId: string, data: AssessmentRequest) => {
    setLoading(true);
    setError(null);
    try {
      const assessment = await api.post<Assessment>(`/courses/${courseId}/assessments`, data);
      setAssessments((prev) => [assessment, ...prev]);
      return assessment;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateAssessment = useCallback(async (courseId: string, id: string, data: AssessmentRequest) => {
    setLoading(true);
    setError(null);
    try {
      const assessment = await api.put<Assessment>(`/courses/${courseId}/assessments/${id}`, data);
      setAssessments((prev) => prev.map((item) => (item.id === id ? assessment : item)));
      return assessment;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteAssessment = useCallback(async (courseId: string, id: string) => {
    setLoading(true);
    setError(null);
    try {
      await api.delete(`/courses/${courseId}/assessments/${id}`);
      setAssessments((prev) => prev.filter((item) => item.id !== id));
    } finally {
      setLoading(false);
    }
  }, []);

  const addQuestion = useCallback(async (assessmentId: string, data: AssessmentQuestionRequest) => {
    return api.post<AssessmentQuestion>(`/assessments/${assessmentId}/questions`, data);
  }, []);

  const fetchQuestionSet = useCallback(async (_assessmentId: string, questionSetId: string) => {
    return api.get<AssessmentQuestionSetDetailResponse>(`/assessment-question-sets/${questionSetId}`);
  }, []);

  const createQuestionSet = useCallback(async (assessmentId: string, data: AssessmentQuestionSetRequest) => {
    return api.post<AssessmentQuestionSet>(`/assessments/${assessmentId}/question-sets`, data);
  }, []);

  const updateQuestionSet = useCallback(async (_assessmentId: string, questionSetId: string, data: AssessmentQuestionSetRequest) => {
    return api.put<AssessmentQuestionSet>(`/assessment-question-sets/${questionSetId}`, data);
  }, []);

  const deleteQuestionSet = useCallback(async (_assessmentId: string, questionSetId: string) => {
    return api.delete<void>(`/assessment-question-sets/${questionSetId}`);
  }, []);

  const addQuestionToSet = useCallback(async (questionSetId: string, data: AssessmentQuestionRequest) => {
    return api.post<AssessmentQuestion>(`/assessment-question-sets/${questionSetId}/questions`, data);
  }, []);

  const updateQuestion = useCallback(async (assessmentId: string, questionId: string, data: AssessmentQuestionRequest) => {
    return api.put<AssessmentQuestion>(`/assessments/${assessmentId}/questions/${questionId}`, data);
  }, []);

  const deleteQuestion = useCallback(async (assessmentId: string, questionId: string) => {
    return api.delete<void>(`/assessments/${assessmentId}/questions/${questionId}`);
  }, []);

  return {
    assessments,
    loading,
    error,
    fetchAssessments,
    fetchAssessment,
    createAssessment,
    updateAssessment,
    deleteAssessment,
    addQuestion,
    fetchQuestionSet,
    createQuestionSet,
    updateQuestionSet,
    deleteQuestionSet,
    addQuestionToSet,
    updateQuestion,
    deleteQuestion,
  };
}

