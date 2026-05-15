export type ChallengeStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
export type ChallengeQuestionType = 'MULTIPLE_CHOICE' | 'ESSAY';
export type QuestionMediaType = 'NONE' | 'IMAGE' | 'VIDEO';
export type ChallengeGradingStatus = 'IN_PROGRESS' | 'PENDING_REVIEW' | 'GRADED';

export interface Challenge {
  id: string;
  title: string;
  description: string | null;
  thumbnailUrl: string | null;
  category: string | null;
  status: ChallengeStatus;
  instructorId: string;
  timeLimitMinutes: number | null;
  maxAttempts: number;
  questionCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ChallengeRequest {
  title: string;
  description?: string;
  thumbnailUrl?: string;
  category?: string;
  status?: ChallengeStatus;
  timeLimitMinutes?: number | null;
  maxAttempts?: number;
}

export interface ChallengeListResponse {
  content: Challenge[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

export interface ChallengeChoice {
  id: string;
  text: string;
  isCorrect: boolean | null;
  sortOrder: number;
}

export interface ChallengeQuestion {
  id: string;
  questionSetId: string;
  title: string | null;
  prompt: string;
  type: ChallengeQuestionType;
  mediaType: QuestionMediaType;
  mediaUrl: string | null;
  points: number;
  sortOrder: number;
  choices: ChallengeChoice[];
}

export interface ChallengeQuestionSet {
  id: string;
  challengeId: string;
  title: string;
  timeLimitMinutes: number | null;
  sortOrder: number;
  questionCount: number;
  completed: boolean;
  latestSubmittedAttemptId: string | null;
  attemptCount: number;
}

export interface ChallengeQuestionSetRequest {
  title: string;
  timeLimitMinutes?: number | null;
  sortOrder?: number;
}

export interface ChallengeQuestionSetDetailResponse {
  questionSet: ChallengeQuestionSet;
  questions: ChallengeQuestion[];
}

export interface ChallengeQuestionRequest {
  title?: string;
  prompt: string;
  type: ChallengeQuestionType;
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

export interface ChallengeDetailResponse {
  challenge: Challenge;
  questions: ChallengeQuestion[];
  questionSets: ChallengeQuestionSet[];
}

export interface StartChallengeAttemptResponse {
  id: string;
  challengeId: string;
  questionSetId: string;
  participantId: string;
  startedAt: string;
  timeLimitMinutes: number | null;
  questions: ChallengeQuestion[];
}

export interface SubmitChallengeAnswerRequest {
  questionId: string;
  choiceId?: string;
  textAnswer?: string;
  fileName?: string;
  fileType?: string;
  fileSize?: number;
  fileUrl?: string;
}

export interface ChallengeAttemptResult {
  id: string;
  challengeId: string;
  questionSetId: string;
  questionSetTitle: string;
  participantId: string;
  participantEmail: string | null;
  score: number | null;
  maxScore: number | null;
  passed: boolean | null;
  gradingStatus: ChallengeGradingStatus;
  startedAt: string;
  submittedAt: string | null;
  gradedAt: string | null;
  answers: Array<{
    questionId: string;
    questionTitle: string | null;
    prompt: string;
    type: ChallengeQuestionType;
    points: number;
    choices: ChallengeChoice[];
    selectedChoiceId: string | null;
    selectedChoiceText: string | null;
    correctChoiceId: string | null;
    correctChoiceText: string | null;
    isCorrect: boolean | null;
    textAnswer: string | null;
    fileName: string | null;
    fileType: string | null;
    fileSize: number | null;
    status: ChallengeGradingStatus;
  }>;
}

export interface ChallengeSubmissionSummary {
  attemptId: string;
  challengeId: string;
  questionSetId: string;
  questionSetTitle: string;
  participantId: string;
  participantEmail: string | null;
  score: number | null;
  maxScore: number | null;
  passed: boolean | null;
  gradingStatus: ChallengeGradingStatus;
  startedAt: string;
  submittedAt: string | null;
  gradedAt: string | null;
}

export interface ChallengeLeaderboardEntry {
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

export interface GradeChallengeAttemptRequest {
  answers: Array<{
    questionId: string;
    isCorrect: boolean;
  }>;
}
