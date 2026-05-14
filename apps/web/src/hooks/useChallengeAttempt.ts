import { useCallback, useState } from 'react';
import api from '@/lib/api';
import type {
  ChallengeAttemptResult,
  ChallengeLeaderboardEntry,
  ChallengeSubmissionSummary,
  GradeChallengeAttemptRequest,
  StartChallengeAttemptResponse,
  SubmitChallengeAnswerRequest,
} from '@/types/challenge';

export function useChallengeAttempt() {
  const [loading, setLoading] = useState(false);

  const startAttempt = useCallback(async (challengeId: string) => {
    setLoading(true);
    try {
      return await api.post<StartChallengeAttemptResponse>(`/challenges/${challengeId}/attempts`);
    } finally {
      setLoading(false);
    }
  }, []);

  const startQuestionSetAttempt = useCallback(async (questionSetId: string) => {
    setLoading(true);
    try {
      return await api.post<StartChallengeAttemptResponse>(`/question-sets/${questionSetId}/attempts`);
    } finally {
      setLoading(false);
    }
  }, []);

  const submitAttempt = useCallback(async (attemptId: string, answers: SubmitChallengeAnswerRequest[]) => {
    setLoading(true);
    try {
      return await api.put<ChallengeAttemptResult>(`/challenge-attempts/${attemptId}/submit`, { answers });
    } finally {
      setLoading(false);
    }
  }, []);

  const getAttemptResult = useCallback(async (attemptId: string) => {
    setLoading(true);
    try {
      return await api.get<ChallengeAttemptResult>(`/challenge-attempts/${attemptId}/result`);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSubmissions = useCallback(async (challengeId: string) => {
    setLoading(true);
    try {
      return await api.get<ChallengeSubmissionSummary[]>(`/challenges/${challengeId}/submissions`);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchLeaderboard = useCallback(async (challengeId: string) => {
    setLoading(true);
    try {
      return await api.get<ChallengeLeaderboardEntry[]>(`/challenges/${challengeId}/leaderboard`);
    } finally {
      setLoading(false);
    }
  }, []);

  const getAttemptReview = useCallback(async (attemptId: string) => {
    setLoading(true);
    try {
      return await api.get<ChallengeAttemptResult>(`/challenge-attempts/${attemptId}/review`);
    } finally {
      setLoading(false);
    }
  }, []);

  const gradeAttempt = useCallback(async (attemptId: string, data: GradeChallengeAttemptRequest) => {
    setLoading(true);
    try {
      return await api.put<ChallengeAttemptResult>(`/challenge-attempts/${attemptId}/grade`, data);
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteAttempt = useCallback(async (attemptId: string) => {
    setLoading(true);
    try {
      await api.delete(`/challenge-attempts/${attemptId}`);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    startAttempt,
    startQuestionSetAttempt,
    submitAttempt,
    getAttemptResult,
    fetchSubmissions,
    fetchLeaderboard,
    getAttemptReview,
    gradeAttempt,
    deleteAttempt,
  };
}
