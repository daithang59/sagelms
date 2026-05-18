import { useCallback, useState } from 'react';
import api from '@/lib/api';
import type {
  AssessmentAttemptResult,
  AssessmentGradebookEntry,
  AssessmentLeaderboardEntry,
  AssessmentSubmissionSummary,
  GradeAssessmentAttemptRequest,
  StartAssessmentAttemptResponse,
  SubmitAssessmentAnswerRequest,
} from '@/types/assessment';

export function useAssessmentAttempt() {
  const [loading, setLoading] = useState(false);

  const startAttempt = useCallback(async (assessmentId: string) => {
    setLoading(true);
    try {
      return await api.post<StartAssessmentAttemptResponse>(`/assessments/${assessmentId}/attempts`);
    } finally {
      setLoading(false);
    }
  }, []);

  const startQuestionSetAttempt = useCallback(async (questionSetId: string) => {
    setLoading(true);
    try {
      return await api.post<StartAssessmentAttemptResponse>(`/assessment-question-sets/${questionSetId}/attempts`);
    } finally {
      setLoading(false);
    }
  }, []);

  const submitAttempt = useCallback(async (attemptId: string, answers: SubmitAssessmentAnswerRequest[]) => {
    setLoading(true);
    try {
      return await api.put<AssessmentAttemptResult>(`/assessment-attempts/${attemptId}/submit`, { answers });
    } finally {
      setLoading(false);
    }
  }, []);

  const getAttemptResult = useCallback(async (attemptId: string) => {
    setLoading(true);
    try {
      return await api.get<AssessmentAttemptResult>(`/assessment-attempts/${attemptId}/result`);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSubmissions = useCallback(async (assessmentId: string) => {
    setLoading(true);
    try {
      return await api.get<AssessmentSubmissionSummary[]>(`/assessments/${assessmentId}/submissions`);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMyGradedSubmissions = useCallback(async (assessmentId: string) => {
    setLoading(true);
    try {
      return await api.get<AssessmentSubmissionSummary[]>(`/assessments/${assessmentId}/my-submissions`);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCourseSubmissions = useCallback(async (courseId: string) => {
    setLoading(true);
    try {
      return await api.get<AssessmentSubmissionSummary[]>(`/courses/${courseId}/assessment-submissions`);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMyCourseResults = useCallback(async (courseId: string) => {
    setLoading(true);
    try {
      return await api.get<AssessmentSubmissionSummary[]>(`/courses/${courseId}/my-assessment-results`);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCourseGradebook = useCallback(async (courseId: string) => {
    setLoading(true);
    try {
      return await api.get<AssessmentGradebookEntry[]>(`/courses/${courseId}/assessment-gradebook`);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchLeaderboard = useCallback(async (assessmentId: string) => {
    setLoading(true);
    try {
      return await api.get<AssessmentLeaderboardEntry[]>(`/assessments/${assessmentId}/leaderboard`);
    } finally {
      setLoading(false);
    }
  }, []);

  const getAttemptReview = useCallback(async (attemptId: string) => {
    setLoading(true);
    try {
      return await api.get<AssessmentAttemptResult>(`/assessment-attempts/${attemptId}/review`);
    } finally {
      setLoading(false);
    }
  }, []);

  const gradeAttempt = useCallback(async (attemptId: string, data: GradeAssessmentAttemptRequest) => {
    setLoading(true);
    try {
      return await api.put<AssessmentAttemptResult>(`/assessment-attempts/${attemptId}/grade`, data);
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteAttempt = useCallback(async (attemptId: string) => {
    setLoading(true);
    try {
      await api.delete(`/assessment-attempts/${attemptId}`);
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
    fetchMyGradedSubmissions,
    fetchCourseSubmissions,
    fetchMyCourseResults,
    fetchCourseGradebook,
    fetchLeaderboard,
    getAttemptReview,
    gradeAttempt,
    deleteAttempt,
  };
}

