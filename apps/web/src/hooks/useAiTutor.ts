import { useCallback, useState } from 'react';
import api from '@/lib/api';
import type {
  AiTutorChatMessage,
  AiTutorChatRequest,
  AiTutorChatResponse,
  AiTutorConversationSummary,
  AiTutorStoredMessage,
} from '@/types/ai-tutor';

type AiTutorLearningContext = {
  courseId?: string | null;
  challengeId?: string | null;
};

function createOptimisticMessage(role: AiTutorChatMessage['role'], content: string): AiTutorChatMessage {
  return {
    id: crypto.randomUUID(),
    role,
    content,
    createdAt: new Date().toISOString(),
  };
}

function getAiTutorErrorMessage(error: unknown) {
  const code = error instanceof Error ? (error as Error & { code?: string }).code : undefined;
  if (code === 'GEMINI_API_KEY_MISSING') {
    return 'AI Tutor chưa được cấu hình Gemini API key.';
  }
  if (code === 'USER_CONTEXT_MISSING') {
    return 'AI Tutor chưa nhận được thông tin người dùng từ Gateway.';
  }
  if (code === 'CONVERSATION_NOT_FOUND') {
    return 'Không tìm thấy cuộc trò chuyện này.';
  }
  if (code === 'LEARNING_CONTEXT_FORBIDDEN') {
    return 'Bạn không có quyền truy cập ngữ cảnh học tập này.';
  }
  if (code === 'LEARNING_CONTEXT_NOT_FOUND') {
    return 'Không tìm thấy ngữ cảnh học tập này.';
  }
  return 'Không thể nhận phản hồi từ AI Tutor.';
}

export function useAiTutor() {
  const [messages, setMessages] = useState<AiTutorChatMessage[]>([]);
  const [conversations, setConversations] = useState<AiTutorConversationSummary[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastPrompt, setLastPrompt] = useState<string | null>(null);
  const [lastContext, setLastContext] = useState<AiTutorLearningContext | null>(null);

  const loadConversations = useCallback(async () => {
    await Promise.resolve();
    setLoadingConversations(true);
    setError(null);
    try {
      const response = await api.get<AiTutorConversationSummary[]>('/ai/conversations');
      setConversations(response);
      return response;
    } catch (err) {
      setError(getAiTutorErrorMessage(err));
      return [];
    } finally {
      setLoadingConversations(false);
    }
  }, []);

  const loadConversation = useCallback(async (id: string) => {
    await Promise.resolve();
    setLoading(true);
    setError(null);
    try {
      const response = await api.get<AiTutorStoredMessage[]>(`/ai/conversations/${id}/messages`);
      setConversationId(id);
      setMessages(response);
      setLastPrompt(null);
      setLastContext(null);
    } catch (err) {
      setError(getAiTutorErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  const newConversation = useCallback(() => {
    setMessages([]);
    setConversationId(null);
    setError(null);
    setLastPrompt(null);
    setLastContext(null);
  }, []);

  const deleteConversation = useCallback(async (id: string) => {
    await api.delete<void>(`/ai/conversations/${id}`);
    setConversations((items) => items.filter((item) => item.id !== id));
    if (conversationId === id) {
      newConversation();
    }
  }, [conversationId, newConversation]);

  const renameConversation = useCallback(async (id: string, rawTitle: string) => {
    const title = rawTitle.trim();
    if (!title) return null;

    try {
      const response = await api.put<AiTutorConversationSummary>(`/ai/conversations/${id}`, { title });
      setConversations((items) => [response, ...items.filter((item) => item.id !== id)]);
      return response;
    } catch (err) {
      setError(getAiTutorErrorMessage(err));
      return null;
    }
  }, []);

  const sendMessage = useCallback(async (rawMessage: string, context?: AiTutorLearningContext) => {
    const message = rawMessage.trim();
    if (!message || loading) return;

    const userMessage = createOptimisticMessage('user', message);
    setMessages((items) => [...items, userMessage]);
    setLoading(true);
    setError(null);
    setLastPrompt(message);
    setLastContext(context ?? null);

    const payload: AiTutorChatRequest = {
      message,
      conversationId,
      courseId: context?.courseId ?? null,
      challengeId: context?.challengeId ?? null,
    };

    try {
      const response = await api.post<AiTutorChatResponse>('/ai/chat', payload);
      setConversationId(response.conversationId);
      setMessages((items) => [
        ...items,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: response.answer,
          createdAt: response.createdAt,
        },
      ]);
      setLastPrompt(null);
      setLastContext(null);
      void loadConversations();
    } catch (err) {
      setError(getAiTutorErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [conversationId, loadConversations, loading]);

  const retryLastMessage = useCallback(async () => {
    if (!lastPrompt || loading) return;

    setLoading(true);
    setError(null);

    try {
      const response = await api.post<AiTutorChatResponse>('/ai/chat', {
        message: lastPrompt,
        conversationId,
        courseId: lastContext?.courseId ?? null,
        challengeId: lastContext?.challengeId ?? null,
      });
      setConversationId(response.conversationId);
      setMessages((items) => [
        ...items,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: response.answer,
          createdAt: response.createdAt,
        },
      ]);
      setLastPrompt(null);
      setLastContext(null);
      void loadConversations();
    } catch (err) {
      setError(getAiTutorErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [conversationId, lastContext, lastPrompt, loadConversations, loading]);

  return {
    messages,
    conversations,
    conversationId,
    loading,
    loadingConversations,
    error,
    lastPrompt,
    loadConversations,
    loadConversation,
    deleteConversation,
    renameConversation,
    newConversation,
    sendMessage,
    retryLastMessage,
  };
}
