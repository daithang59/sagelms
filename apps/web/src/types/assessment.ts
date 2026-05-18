export type AssessmentStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
export type AssessmentQuestionType = 'MULTIPLE_CHOICE' | 'ESSAY';
export type QuestionMediaType = 'NONE' | 'IMAGE' | 'VIDEO';
export type AssessmentGradingStatus = 'IN_PROGRESS' | 'PENDING_REVIEW' | 'GRADED';

export interface Assessment {
  id: string;
  title: string;
  description: string | null;
  thumbnailUrl: string | null;
  category: string | null;
  courseId: string;
  status: AssessmentStatus;
  instructorId: string;
  timeLimitMinutes: number | null;
  maxAttempts: number;
  questionCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface AssessmentRequest {
  title: string;
  description?: string;
  thumbnailUrl?: string;
  category?: string;
  status?: AssessmentStatus;
  timeLimitMinutes?: number | null;
  maxAttempts?: number;
}

export interface AssessmentListResponse {
  content: Assessment[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

export interface AssessmentChoice {
  id: string;
  text: string;
  isCorrect: boolean | null;
  sortOrder: number;
}

export interface AssessmentQuestion {
  id: string;
  questionSetId: string;
  title: string | null;
  prompt: string;
  type: AssessmentQuestionType;
  mediaType: QuestionMediaType;
  mediaUrl: string | null;
  points: number;
  sortOrder: number;
  choices: AssessmentChoice[];
}

export interface AssessmentQuestionSet {
  id: string;
  assessmentId: string;
  title: string;
  timeLimitMinutes: number | null;
  sortOrder: number;
  questionCount: number;
  completed: boolean;
  latestSubmittedAttemptId: string | null;
  attemptCount: number;
  maxAttempts?: number | null;
}

export interface AssessmentQuestionSetRequest {
  title: string;
  timeLimitMinutes?: number | null;
  sortOrder?: number;
  maxAttempts?: number | null;
}

export interface AssessmentQuestionSetDetailResponse {
  questionSet: AssessmentQuestionSet;
  questions: AssessmentQuestion[];
}

export interface AssessmentQuestionRequest {
  title?: string;
  prompt: string;
  type: AssessmentQuestionType;
  mediaType?: QuestionMediaType;
  mediaUrl?: string;
  points?: number;
  sortOrder?: number;
  choices?: Array<{
    text: string;
    isCorrect: boolean;
    sortOrder?: number;
  }>;
}

export interface AssessmentDetailResponse {
  assessment: Assessment;
  questions: AssessmentQuestion[];
  questionSets: AssessmentQuestionSet[];
}

export interface StartAssessmentAttemptResponse {
  id: string;
  assessmentId: string;
  questionSetId: string;
  participantId: string;
  startedAt: string;
  timeLimitMinutes: number | null;
  questions: AssessmentQuestion[];
}

export interface SubmitAssessmentAnswerRequest {
  questionId: string;
  choiceId?: string;
  textAnswer?: string;
  fileName?: string;
  fileType?: string;
  fileSize?: number;
  fileUrl?: string;
}

export interface AssessmentAttemptResult {
  id: string;
  assessmentId: string;
  questionSetId: string;
  questionSetTitle: string;
  participantId: string;
  participantEmail: string | null;
  score: number | null;
  maxScore: number | null;
  passed: boolean | null;
  gradingStatus: AssessmentGradingStatus;
  startedAt: string;
  submittedAt: string | null;
  gradedAt: string | null;
  usedSeconds: number | null;
  answers: Array<{
    questionId: string;
    questionTitle: string | null;
    prompt: string;
    type: AssessmentQuestionType;
    points: number;
    choices: AssessmentChoice[];
    selectedChoiceId: string | null;
    selectedChoiceText: string | null;
    correctChoiceId: string | null;
    correctChoiceText: string | null;
    isCorrect: boolean | null;
    textAnswer: string | null;
    fileName: string | null;
    fileType: string | null;
    fileSize: number | null;
    status: AssessmentGradingStatus;
  }>;
}

export interface AssessmentSubmissionSummary {
  attemptId: string;
  assessmentId: string;
  courseId: string;
  assessmentTitle: string;
  questionSetId: string;
  questionSetTitle: string;
  participantId: string;
  participantEmail: string | null;
  score: number | null;
  maxScore: number | null;
  passed: boolean | null;
  gradingStatus: AssessmentGradingStatus;
  startedAt: string;
  submittedAt: string | null;
  gradedAt: string | null;
  usedSeconds: number | null;
}

export interface AssessmentGradebookEntry {
  participantId: string;
  participantEmail: string | null;
  gradedAttempts: number;
  submittedAttempts: number;
  totalScore: number;
  totalMaxScore: number;
  averageScore: number;
}

export interface AssessmentLeaderboardEntry {
  rank: number;
  participantId: string;
  participantEmail: string | null;
  completedQuestionSets: number;
  totalQuestionSets: number;
  totalUsedSeconds: number;
  totalLimitSeconds: number;
  accuracyPercent: number;
  rankingScore: number;
  firstStartedAt: string;
}

export interface GradeAssessmentAttemptRequest {
  answers: Array<{
    questionId: string;
    isCorrect: boolean;
  }>;
}

