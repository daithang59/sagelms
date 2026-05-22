import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { Bot, Check, ChevronsLeft, ChevronsRight, MessageSquarePlus, Pencil, RotateCcw, Send, Sparkles, Trash2, X } from 'lucide-react';
import { Button, Card, CardBody, Message, useConfirm } from '@/components/ui';
import { useAiTutor } from '@/hooks/useAiTutor';

const SAMPLE_PROMPTS = [
  'Giải thích React state là gì?',
  'So sánh Kubernetes Deployment và StatefulSet.',
  'Làm sao học hiệu quả khi bắt đầu với Spring Boot?',
];

function formatConversationTime(value: string) {
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

export default function AiTutorPage() {
  const {
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
  } = useAiTutor();
  const confirm = useConfirm();
  const [input, setInput] = useState('');
  const [historyCollapsed, setHistoryCollapsed] = useState(false);
  const [editingConversationId, setEditingConversationId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const initialize = async () => {
      await Promise.resolve();
      const items = await loadConversations();
      if (items[0]) {
        await loadConversation(items[0].id);
      }
    };

    void initialize();
  }, [loadConversation, loadConversations]);

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

  const handleDeleteConversation = async (id: string) => {
    const accepted = await confirm({
      title: 'Xóa cuộc trò chuyện',
      message: 'Bạn có chắc chắn muốn xóa cuộc trò chuyện này khỏi lịch sử AI Tutor?',
      confirmLabel: 'Xóa',
      cancelLabel: 'Hủy',
      variant: 'danger',
    });
    if (!accepted) return;
    await deleteConversation(id);
  };

  const startEditingConversation = (id: string, title: string) => {
    setEditingConversationId(id);
    setEditingTitle(title);
  };

  const cancelEditingConversation = () => {
    setEditingConversationId(null);
    setEditingTitle('');
  };

  const handleRenameConversation = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingConversationId) return;

    const updated = await renameConversation(editingConversationId, editingTitle);
    if (updated) {
      cancelEditingConversation();
    }
  };

  return (
    <div className="mx-auto flex h-[calc(100vh-8rem)] max-w-7xl flex-col space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-cyan-500 text-white shadow-lg shadow-violet-500/20">
          <Bot className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">AI Tutor</h1>
          <p className="text-sm text-slate-500">Hỏi đáp thông minh với trợ giảng AI của SageLMS.</p>
        </div>
      </div>

      <div
        className="grid min-h-0 flex-1 gap-5"
        style={{ gridTemplateColumns: historyCollapsed ? 'minmax(0, 1fr) 88px' : 'minmax(0, 1fr) 320px' }}
      >
        <Card className="flex min-h-0 overflow-hidden">
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
                  {messages.map((message) => (
                    <Message key={message.id} role={message.role} content={message.content} createdAt={message.createdAt} />
                  ))}

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

        <Card className="min-h-0 overflow-hidden">
          {historyCollapsed ? (
            <CardBody className="flex h-full min-h-0 flex-col items-center gap-3 p-3">
              <button
                type="button"
                onClick={() => setHistoryCollapsed(false)}
                className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 transition hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700"
                aria-label="Mở rộng lịch sử hội thoại"
                title="Mở rộng lịch sử"
              >
                <ChevronsLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={newConversation}
                className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-cyan-500 text-white shadow-lg shadow-violet-500/20 transition hover:brightness-105"
                aria-label="Cuộc trò chuyện mới"
                title="Cuộc trò chuyện mới"
              >
                <MessageSquarePlus className="h-5 w-5" />
              </button>
            </CardBody>
          ) : (
            <CardBody className="flex h-full min-h-0 flex-col p-0">
              <div className="border-b border-slate-100 px-5 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">Lịch sử hội thoại</h2>
                    <p className="text-sm text-slate-500">{conversations.length} cuộc trò chuyện</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setHistoryCollapsed(true)}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700"
                    aria-label="Thu hẹp lịch sử hội thoại"
                    title="Thu hẹp lịch sử"
                  >
                    <ChevronsRight className="h-5 w-5" />
                  </button>
                </div>
                <Button type="button" variant="secondary" onClick={newConversation} className="mt-4 w-full justify-center">
                  <MessageSquarePlus className="h-4 w-4" />
                  Cuộc trò chuyện mới
                </Button>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto p-3">
                {loadingConversations && conversations.length === 0 ? (
                  <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-500">Đang tải lịch sử...</div>
                ) : conversations.length === 0 ? (
                  <div className="flex h-full min-h-[220px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 px-5 text-center text-sm text-slate-500">
                    <Sparkles className="mb-3 h-8 w-8 text-slate-300" />
                    Chưa có cuộc trò chuyện nào.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {conversations.map((conversation) => {
                      const active = conversation.id === conversationId;
                      const editing = editingConversationId === conversation.id;
                      return (
                        <div
                          key={conversation.id}
                          className={`group flex items-start gap-2 rounded-2xl border px-3 py-3 transition ${
                            active
                              ? 'border-violet-200 bg-violet-50'
                              : 'border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          {editing ? (
                            <form onSubmit={handleRenameConversation} className="min-w-0 flex-1 space-y-2">
                              <input
                                value={editingTitle}
                                onChange={(event) => setEditingTitle(event.target.value.slice(0, 160))}
                                className="w-full rounded-xl border border-violet-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                                autoFocus
                              />
                              <div className="flex gap-2">
                                <button
                                  type="submit"
                                  className="inline-flex h-8 flex-1 items-center justify-center gap-1 rounded-xl bg-emerald-50 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100"
                                >
                                  <Check className="h-4 w-4" />
                                  Lưu
                                </button>
                                <button
                                  type="button"
                                  onClick={cancelEditingConversation}
                                  className="inline-flex h-8 flex-1 items-center justify-center gap-1 rounded-xl bg-slate-100 text-xs font-semibold text-slate-600 transition hover:bg-slate-200"
                                >
                                  <X className="h-4 w-4" />
                                  Hủy
                                </button>
                              </div>
                            </form>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => void loadConversation(conversation.id)}
                                className="min-w-0 flex-1 text-left"
                              >
                                <p className="truncate text-sm font-semibold text-slate-800">{conversation.title}</p>
                                <p className="mt-1 text-xs text-slate-500">{formatConversationTime(conversation.updatedAt)}</p>
                              </button>
                              <div className="flex shrink-0 flex-col gap-1">
                                <button
                                  type="button"
                                  onClick={() => startEditingConversation(conversation.id, conversation.title)}
                                  className="inline-flex h-8 items-center justify-center gap-1 rounded-xl px-2 text-xs font-semibold text-slate-600 opacity-80 transition hover:bg-violet-50 hover:text-violet-700 hover:opacity-100"
                                  aria-label="Chỉnh sửa cuộc trò chuyện"
                                >
                                  <Pencil className="h-4 w-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => void handleDeleteConversation(conversation.id)}
                                  className="flex h-8 items-center justify-center rounded-xl text-rose-500 opacity-70 transition hover:bg-rose-50 hover:opacity-100"
                                  aria-label="Xóa cuộc trò chuyện"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </CardBody>
          )}
        </Card>
      </div>
    </div>
  );
}
