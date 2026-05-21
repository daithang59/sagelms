export type AiTutorChatRole = 'user' | 'assistant';

export interface AiTutorChatMessage {
  id: string;
  role: AiTutorChatRole;
  content: string;
  createdAt: string;
}

export interface AiTutorChatHistoryItem {
  role: AiTutorChatRole;
  content: string;
}

export interface AiTutorChatRequest {
  message: string;
  courseId: string | null;
  conversationId?: string | null;
  history: AiTutorChatHistoryItem[];
}

export interface AiTutorChatResponse {
  conversationId: string;
  answer: string;
  model: string;
  courseId?: string | null;
  createdAt: string;
}
