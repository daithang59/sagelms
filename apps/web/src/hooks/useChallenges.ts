import { useCallback, useState } from 'react';
import api from '@/lib/api';
import type {
  Challenge,
  ChallengeDetailResponse,
  ChallengeListResponse,
  ChallengeQuestion,
  ChallengeQuestionRequest,
  ChallengeQuestionSet,
  ChallengeQuestionSetDetailResponse,
  ChallengeQuestionSetRequest,
  ChallengeRequest,
} from '@/types/challenge';

export function useChallenges() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchChallenges = useCallback(async (params?: { search?: string; page?: number; size?: number }) => {
    setLoading(true);
    setError(null);
    try {
      const queryParams = new URLSearchParams();
      if (params?.search) queryParams.set('search', params.search);
      if (params?.page !== undefined) queryParams.set('page', String(params.page));
      if (params?.size !== undefined) queryParams.set('size', String(params.size));
      const query = queryParams.toString();
      const response = await api.get<ChallengeListResponse>(`/challenges${query ? `?${query}` : ''}`);
      setChallenges(response.content || []);
      return response;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch challenges';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchChallenge = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      return await api.get<ChallengeDetailResponse>(`/challenges/${id}`);
    } finally {
      setLoading(false);
    }
  }, []);

  const createChallenge = useCallback(async (data: ChallengeRequest) => {
    setLoading(true);
    setError(null);
    try {
      const challenge = await api.post<Challenge>('/challenges', data);
      setChallenges((prev) => [challenge, ...prev]);
      return challenge;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateChallenge = useCallback(async (id: string, data: ChallengeRequest) => {
    setLoading(true);
    setError(null);
    try {
      const challenge = await api.put<Challenge>(`/challenges/${id}`, data);
      setChallenges((prev) => prev.map((item) => (item.id === id ? challenge : item)));
      return challenge;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteChallenge = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      await api.delete(`/challenges/${id}`);
      setChallenges((prev) => prev.filter((item) => item.id !== id));
    } finally {
      setLoading(false);
    }
  }, []);

  const addQuestion = useCallback(async (challengeId: string, data: ChallengeQuestionRequest) => {
    return api.post<ChallengeQuestion>(`/challenges/${challengeId}/questions`, data);
  }, []);

  const fetchQuestionSet = useCallback(async (challengeId: string, questionSetId: string) => {
    return api.get<ChallengeQuestionSetDetailResponse>(`/challenges/${challengeId}/question-sets/${questionSetId}`);
  }, []);

  const createQuestionSet = useCallback(async (challengeId: string, data: ChallengeQuestionSetRequest) => {
    return api.post<ChallengeQuestionSet>(`/challenges/${challengeId}/question-sets`, data);
  }, []);

  const updateQuestionSet = useCallback(async (challengeId: string, questionSetId: string, data: ChallengeQuestionSetRequest) => {
    return api.put<ChallengeQuestionSet>(`/challenges/${challengeId}/question-sets/${questionSetId}`, data);
  }, []);

  const deleteQuestionSet = useCallback(async (challengeId: string, questionSetId: string) => {
    return api.delete<void>(`/challenges/${challengeId}/question-sets/${questionSetId}`);
  }, []);

  const addQuestionToSet = useCallback(async (questionSetId: string, data: ChallengeQuestionRequest) => {
    return api.post<ChallengeQuestion>(`/question-sets/${questionSetId}/questions`, data);
  }, []);

  const updateQuestion = useCallback(async (challengeId: string, questionId: string, data: ChallengeQuestionRequest) => {
    return api.put<ChallengeQuestion>(`/challenges/${challengeId}/questions/${questionId}`, data);
  }, []);

  const deleteQuestion = useCallback(async (challengeId: string, questionId: string) => {
    return api.delete<void>(`/challenges/${challengeId}/questions/${questionId}`);
  }, []);

  return {
    challenges,
    loading,
    error,
    fetchChallenges,
    fetchChallenge,
    createChallenge,
    updateChallenge,
    deleteChallenge,
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
