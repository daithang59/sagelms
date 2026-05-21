import { useCallback, useState } from 'react';
import api from '@/lib/api';
import type {
  AiTutorChatMessage,
  AiTutorChatRequest,
  AiTutorChatResponse,
} from '@/types/ai-tutor';

const MAX_HISTORY_MESSAGES = 20;

function createMessage(role: AiTutorChatMessage['role'], content: string): AiTutorChatMessage {
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
  if (code === 'LANGCHAIN_GEMINI_MISSING') {
    return 'AI Tutor service thiếu dependency LangChain Gemini.';
  }
  return 'Không thể nhận phản hồi từ AI Tutor.';
}

export function useAiTutor() {
  const [messages, setMessages] = useState<AiTutorChatMessage[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastPrompt, setLastPrompt] = useState<string | null>(null);

  const clearChat = useCallback(() => {
    setMessages([]);
    setConversationId(null);
    setError(null);
    setLastPrompt(null);
  }, []);

  const sendMessage = useCallback(async (rawMessage: string) => {
    const message = rawMessage.trim();
    if (!message || loading) return;

    const userMessage = createMessage('user', message);
    const history = messages.slice(-MAX_HISTORY_MESSAGES).map((item) => ({
      role: item.role,
      content: item.content,
    }));

    setMessages((items) => [...items, userMessage]);
    setLoading(true);
    setError(null);
    setLastPrompt(message);

    const payload: AiTutorChatRequest = {
      message,
      conversationId,
      courseId: null,
      history,
    };

    try {
      const response = await api.post<AiTutorChatResponse>('/ai/chat', payload);
      setConversationId(response.conversationId);
      setMessages((items) => [...items, createMessage('assistant', response.answer)]);
      setLastPrompt(null);
    } catch (err) {
      setError(getAiTutorErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [conversationId, loading, messages]);

  const retryLastMessage = useCallback(async () => {
    if (!lastPrompt || loading) return;

    const latestMessage = messages[messages.length - 1];
    const historySource = latestMessage?.role === 'user' && latestMessage.content === lastPrompt
      ? messages.slice(0, -1)
      : messages;
    const history = historySource.slice(-MAX_HISTORY_MESSAGES).map((item) => ({
      role: item.role,
      content: item.content,
    }));

    setLoading(true);
    setError(null);

    try {
      const response = await api.post<AiTutorChatResponse>('/ai/chat', {
        message: lastPrompt,
        conversationId,
        courseId: null,
        history,
      });
      setConversationId(response.conversationId);
      setMessages((items) => [...items, createMessage('assistant', response.answer)]);
      setLastPrompt(null);
    } catch (err) {
      setError(getAiTutorErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [conversationId, lastPrompt, loading, messages]);

  return {
    messages,
    conversationId,
    loading,
    error,
    lastPrompt,
    sendMessage,
    retryLastMessage,
    clearChat,
  };
}
