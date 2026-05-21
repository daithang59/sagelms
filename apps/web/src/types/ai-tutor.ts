export type AiTutorChatRole = 'user' | 'assistant';

export interface AiTutorChatMessage {
  id: string;
  role: AiTutorChatRole;
  content: string;
  createdAt: string;
}

export interface AiTutorConversationSummary {
  id: string;
  title: string;
  courseId?: string | null;
  updatedAt: string;
  createdAt: string;
}

export interface AiTutorStoredMessage {
  id: string;
  role: AiTutorChatRole;
  content: string;
  createdAt: string;
}

export interface AiTutorChatRequest {
  message: string;
  courseId: string | null;
  conversationId?: string | null;
}

export interface AiTutorChatResponse {
  conversationId: string;
  answer: string;
  model: string;
  courseId?: string | null;
  createdAt: string;
}
