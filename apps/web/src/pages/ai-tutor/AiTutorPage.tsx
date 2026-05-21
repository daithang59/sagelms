import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { Bot, RotateCcw, Send, Sparkles, Trash2, UserRound } from 'lucide-react';
import { Button, Card, CardBody } from '@/components/ui';
import { useAiTutor } from '@/hooks/useAiTutor';

const SAMPLE_PROMPTS = [
  'Giải thích React state là gì?',
  'So sánh Kubernetes Deployment và StatefulSet.',
  'Làm sao học hiệu quả khi bắt đầu với Spring Boot?',
];

function formatTime(value: string) {
  return new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

export default function AiTutorPage() {
  const {
    messages,
    loading,
    error,
    lastPrompt,
    sendMessage,
    retryLastMessage,
    clearChat,
  } = useAiTutor();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, loading, error]);

  const canSend = input.trim().length > 0 && !loading;

  const handleSubmit = async (event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault();
    if (!canSend) return;

    const message = input;
    setInput('');
    await sendMessage(message);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      void handleSubmit();
    }
  };

  const handleSamplePrompt = (prompt: string) => {
    setInput('');
    void sendMessage(prompt);
  };

  return (
    <div className="mx-auto flex h-[calc(100vh-8rem)] max-w-6xl flex-col space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-cyan-500 text-white shadow-lg shadow-violet-500/20">
            <Bot className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">AI Tutor</h1>
            <p className="text-sm text-slate-500">Hỏi đáp thông minh với trợ giảng AI của SageLMS.</p>
          </div>
        </div>

        {messages.length > 0 && (
          <Button type="button" variant="secondary" onClick={clearChat}>
            <Trash2 className="h-4 w-4" />
            Xóa cuộc trò chuyện
          </Button>
        )}
      </div>

      <Card className="flex min-h-0 flex-1 overflow-hidden">
        <CardBody className="flex min-h-0 flex-1 flex-col p-0">
          <div className="flex-1 overflow-y-auto px-5 py-6">
            {messages.length === 0 ? (
              <div className="flex h-full min-h-[420px] flex-col items-center justify-center text-center">
                <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-50 text-violet-600">
                  <Sparkles className="h-8 w-8" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">Bạn muốn học gì hôm nay?</h2>
                <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
                  Đặt câu hỏi về bài học, công nghệ, cách ôn tập hoặc nhờ AI Tutor giải thích một khái niệm khó hiểu.
                </p>
                <div className="mt-6 grid w-full max-w-3xl gap-3 sm:grid-cols-3">
                  {SAMPLE_PROMPTS.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() => handleSamplePrompt(prompt)}
                      disabled={loading}
                      className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left text-sm font-medium text-slate-700 transition hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                {messages.map((message) => {
                  const isUser = message.role === 'user';
                  return (
                    <div key={message.id} className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
                      {!isUser && (
                        <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                          <Bot className="h-5 w-5" />
                        </div>
                      )}
                      <div className={`max-w-[82%] ${isUser ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                        <div
                          className={`rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm ${
                            isUser
                              ? 'bg-gradient-to-r from-violet-600 to-cyan-500 text-white shadow-violet-500/15'
                              : 'border border-slate-100 bg-white text-slate-700'
                          }`}
                        >
                          <p className="whitespace-pre-wrap">{message.content}</p>
                        </div>
                        <span className="px-1 text-xs text-slate-400">{formatTime(message.createdAt)}</span>
                      </div>
                      {isUser && (
                        <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                          <UserRound className="h-5 w-5" />
                        </div>
                      )}
                    </div>
                  );
                })}

                {loading && (
                  <div className="flex justify-start gap-3">
                    <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                      <Bot className="h-5 w-5" />
                    </div>
                    <div className="rounded-2xl border border-slate-100 bg-white px-4 py-3 text-sm text-slate-500 shadow-sm">
                      <span className="inline-flex items-center gap-2">
                        <span className="h-2 w-2 animate-pulse rounded-full bg-violet-500" />
                        AI Tutor đang suy nghĩ...
                      </span>
                    </div>
                  </div>
                )}

                {error && (
                  <div className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <span>{error}</span>
                      {lastPrompt && (
                        <Button type="button" variant="outline" size="sm" onClick={() => void retryLastMessage()} disabled={loading}>
                          <RotateCcw className="h-4 w-4" />
                          Gửi lại
                        </Button>
                      )}
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="border-t border-slate-100 bg-white px-5 py-4">
            <div className="flex items-end gap-3">
              <div className="min-w-0 flex-1">
                <label className="sr-only" htmlFor="ai-tutor-message">
                  Nhập câu hỏi cho AI Tutor
                </label>
                <textarea
                  id="ai-tutor-message"
                  value={input}
                  onChange={(event) => setInput(event.target.value.slice(0, 4000))}
                  onKeyDown={handleKeyDown}
                  placeholder="Nhập câu hỏi của bạn..."
                  rows={2}
                  className="max-h-40 min-h-[56px] w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-violet-300 focus:bg-white focus:ring-4 focus:ring-violet-100"
                />
                <div className="mt-1 text-right text-xs text-slate-400">{input.length}/4000</div>
              </div>
              <Button type="submit" size="lg" isLoading={loading} disabled={!canSend} className="mb-5 h-12 px-4">
                <Send className="h-5 w-5" />
                <span className="hidden sm:inline">Gửi</span>
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
