import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Badge, Button, Card, CardBody, useConfirm } from '@/components/ui';
import { useToast } from '@/components/Toast';
import { useChallenges } from '@/hooks';
import type {
  Challenge,
  ChallengeQuestion,
  ChallengeQuestionRequest,
  ChallengeQuestionSet,
  ChallengeQuestionType,
  QuestionMediaType,
} from '@/types/challenge';
import { ArrowLeft, ChevronLeft, ChevronRight, FileText, Image as ImageIcon, ListChecks, Plus, Save, Trash2, Video } from 'lucide-react';

interface ChoiceDraft {
  text: string;
  isCorrect: boolean;
}

interface QuestionDraft {
  localId: string;
  id?: string;
  type: ChallengeQuestionType;
  prompt: string;
  mediaType: QuestionMediaType;
  mediaUrl: string;
  points: number | '';
  choices: ChoiceDraft[];
}

interface PendingDraft {
  draft: QuestionDraft;
  insertIndex: number;
  edge: 'before' | 'after';
}

const blankChoices = (): ChoiceDraft[] => [
  { text: '', isCorrect: true },
  { text: '', isCorrect: false },
];

const createBlankDraft = (): QuestionDraft => ({
  localId: crypto.randomUUID(),
  type: 'MULTIPLE_CHOICE',
  prompt: '',
  mediaType: 'NONE',
  mediaUrl: '',
  points: 1,
  choices: blankChoices(),
});

const normalizeQuestionPoints = (points: number | '') => {
  if (points === '' || !Number.isFinite(points) || points <= 0 || points >= 100) {
    return 1;
  }
  return points;
};

const toDraft = (question: ChallengeQuestion): QuestionDraft => ({
  localId: question.id,
  id: question.id,
  type: question.type,
  prompt: question.prompt,
  mediaType: question.mediaType || 'NONE',
  mediaUrl: question.mediaUrl || '',
  points: question.points || 1,
  choices:
    question.type === 'MULTIPLE_CHOICE' && question.choices.length >= 2
      ? question.choices.map((choice) => ({ text: choice.text, isCorrect: Boolean(choice.isCorrect) }))
      : blankChoices(),
});

function getYouTubeEmbedUrl(url: string) {
  const trimmedUrl = url.trim();
  if (!trimmedUrl) return '';
  try {
    const parsed = new URL(trimmedUrl);
    const hostname = parsed.hostname.replace(/^www\./, '');
    if (hostname === 'youtube.com' || hostname === 'm.youtube.com') {
      const videoId = parsed.searchParams.get('v');
      return videoId ? `https://www.youtube.com/embed/${videoId}` : trimmedUrl.replace('/shorts/', '/embed/');
    }
    if (hostname === 'youtu.be') {
      const videoId = parsed.pathname.split('/').filter(Boolean)[0];
      return videoId ? `https://www.youtube.com/embed/${videoId}` : '';
    }
  } catch {
    return '';
  }
  return '';
}

export default function QuestionPage() {
  const { id, questionSetId, questionId } = useParams<{ id: string; questionSetId?: string; questionId?: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const confirm = useConfirm();
  const {
    fetchChallenge,
    fetchQuestionSet,
    createQuestionSet,
    updateQuestionSet,
    deleteQuestionSet,
    addQuestionToSet,
    updateQuestion,
    deleteQuestion,
  } = useChallenges();

  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [questionSet, setQuestionSet] = useState<ChallengeQuestionSet | null>(null);
  const [setTitle, setSetTitle] = useState('');
  const [setTimeLimit, setSetTimeLimit] = useState<number | ''>('');
  const [drafts, setDrafts] = useState<QuestionDraft[]>([]);
  const [activeLocalId, setActiveLocalId] = useState('');
  const [pendingDraft, setPendingDraft] = useState<PendingDraft | null>(null);
  const [persistedQuestionIds, setPersistedQuestionIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const activeIndex = useMemo(
    () => drafts.findIndex((draft) => draft.localId === activeLocalId),
    [activeLocalId, drafts],
  );
  const activeDraft = pendingDraft?.draft.localId === activeLocalId
    ? pendingDraft.draft
    : activeIndex >= 0
      ? drafts[activeIndex]
      : drafts[0];
  const isPendingActive = Boolean(pendingDraft && pendingDraft.draft.localId === activeLocalId);
  const mediaUrl = activeDraft?.mediaUrl.trim() || '';
  const youtubeEmbedUrl = activeDraft?.mediaType === 'VIDEO' ? getYouTubeEmbedUrl(mediaUrl) : '';

  useEffect(() => {
    if (!id) return;
    let ignore = false;

    fetchChallenge(id)
      .then(async (detail) => {
        if (ignore) return;
        setChallenge(detail.challenge);

        if (!questionSetId || questionSetId === 'new') {
          setQuestionSet(null);
          setSetTitle('');
          setSetTimeLimit('');
          const blank = createBlankDraft();
          setDrafts([]);
          setActiveLocalId(blank.localId);
          setPendingDraft({ draft: blank, insertIndex: 0, edge: 'after' });
          setPersistedQuestionIds([]);
          return;
        }

        const setDetail = await fetchQuestionSet(id, questionSetId);
        if (ignore) return;
        const loadedDrafts = setDetail.questions.map(toDraft);
        const targetDraft =
          (questionId && loadedDrafts.find((draft) => draft.id === questionId)) ||
          loadedDrafts[0] ||
          createBlankDraft();

        setQuestionSet(setDetail.questionSet);
        setSetTitle(setDetail.questionSet.title);
        setSetTimeLimit(setDetail.questionSet.timeLimitMinutes ?? '');
        setDrafts(loadedDrafts);
        setActiveLocalId(targetDraft.localId);
        setPendingDraft(loadedDrafts.length > 0 ? null : { draft: targetDraft, insertIndex: 0, edge: 'after' });
        setPersistedQuestionIds(loadedDrafts.flatMap((draft) => (draft.id ? [draft.id] : [])));
      })
      .catch((error) => {
        if (!ignore) {
          showToast(error instanceof Error ? error.message : 'Không tải được tập câu hỏi', 'error');
        }
      });

    return () => {
      ignore = true;
    };
  }, [fetchChallenge, fetchQuestionSet, id, questionId, questionSetId, showToast]);

  const patchActiveDraft = (patch: Partial<QuestionDraft>) => {
    if (!activeDraft) return;
    if (isPendingActive && pendingDraft) {
      const nextDraft = { ...pendingDraft.draft, ...patch };
      if (nextDraft.prompt.trim()) {
        const insertIndex = Math.max(0, Math.min(pendingDraft.insertIndex, drafts.length));
        setDrafts((prev) => [
          ...prev.slice(0, insertIndex),
          nextDraft,
          ...prev.slice(insertIndex),
        ]);
        setPendingDraft(null);
        setActiveLocalId(nextDraft.localId);
        return;
      }
      setPendingDraft({ ...pendingDraft, draft: nextDraft });
      return;
    }
    const nextDraft = { ...activeDraft, ...patch };
    if ('prompt' in patch && !nextDraft.prompt.trim()) {
      const insertIndex = Math.max(0, activeIndex);
      const remainingDrafts = drafts.filter((draft) => draft.localId !== activeDraft.localId);
      setDrafts(remainingDrafts);
      setPendingDraft({
        draft: nextDraft,
        insertIndex,
        edge: insertIndex === 0 ? 'before' : 'after',
      });
      setActiveLocalId(nextDraft.localId);
      return;
    }
    setDrafts((prev) => prev.map((draft) => (
      draft.localId === activeDraft.localId ? nextDraft : draft
    )));
  };

  const updateChoice = (index: number, patch: Partial<ChoiceDraft>) => {
    if (!activeDraft) return;
    const nextChoices = activeDraft.choices.map((choice, choiceIndex) => {
      if (choiceIndex !== index) {
        return patch.isCorrect ? { ...choice, isCorrect: false } : choice;
      }
      return { ...choice, ...patch };
    });
    patchActiveDraft({ choices: nextChoices });
  };

  const createPendingQuestion = (side: 'before' | 'after', insertIndex: number) => {
    const blank = createBlankDraft();
    setPendingDraft({
      draft: blank,
      insertIndex: Math.max(0, Math.min(insertIndex, drafts.length)),
      edge: side,
    });
    setActiveLocalId(blank.localId);
  };

  const goToAdjacentQuestion = (side: 'before' | 'after') => {
    if (isPendingActive && pendingDraft) {
      const fallbackIndex = side === 'before'
        ? Math.max(0, Math.min(pendingDraft.insertIndex - 1, drafts.length - 1))
        : Math.max(0, Math.min(pendingDraft.insertIndex, drafts.length - 1));
      const fallbackDraft = drafts[fallbackIndex];
      if (fallbackDraft) {
        setPendingDraft(null);
        setActiveLocalId(fallbackDraft.localId);
      }
      return;
    }

    if (side === 'before') {
      if (activeIndex > 0) {
        setActiveLocalId(drafts[activeIndex - 1].localId);
        return;
      }
      createPendingQuestion('before', 0);
      return;
    }

    if (activeIndex >= 0 && activeIndex < drafts.length - 1) {
      setActiveLocalId(drafts[activeIndex + 1].localId);
      return;
    }
    createPendingQuestion('after', drafts.length);
  };

  const addQuestionAfterCurrent = () => {
    const insertIndex = activeIndex >= 0 ? activeIndex + 1 : drafts.length;
    createPendingQuestion('after', insertIndex);
  };

  const removeDraft = async (draft: QuestionDraft) => {
    const confirmed = await confirm({
      title: 'Xóa câu hỏi',
      message: 'Bạn có chắc chắn muốn xóa câu hỏi này khỏi tập câu hỏi?',
      confirmLabel: 'Xác nhận',
      cancelLabel: 'Hủy',
      variant: 'danger',
    });
    if (!confirmed) return;
    const remainingDrafts = drafts.filter((item) => item.localId !== draft.localId);
    setDrafts(remainingDrafts);
    if (activeLocalId === draft.localId) {
      const nextActiveDraft = remainingDrafts[Math.max(0, Math.min(activeIndex, remainingDrafts.length - 1))];
      if (nextActiveDraft) {
        setPendingDraft(null);
        setActiveLocalId(nextActiveDraft.localId);
      } else {
        const blank = createBlankDraft();
        setPendingDraft({ draft: blank, insertIndex: 0, edge: 'after' });
        setActiveLocalId(blank.localId);
      }
    }
  };

  const validateDrafts = () => {
    const filledDrafts = drafts;
    if (!setTitle.trim()) {
      showToast('Vui lòng nhập tiêu đề tập câu hỏi.', 'error');
      return null;
    }
    if (filledDrafts.length !== drafts.length) {
      showToast('Vui lòng nhập nội dung cho tất cả câu hỏi trước khi lưu tập câu hỏi.', 'error');
      return null;
    }
    for (const draft of filledDrafts) {
      if (draft.type === 'MULTIPLE_CHOICE') {
        const validChoices = draft.choices.filter((choice) => choice.text.trim());
        const correctCount = validChoices.filter((choice) => choice.isCorrect).length;
        if (validChoices.length < 2 || correctCount !== 1) {
          showToast('Mỗi câu trắc nghiệm cần ít nhất 2 đáp án và đúng đúng 1 đáp án.', 'error');
          return null;
        }
      }
    }
    return filledDrafts;
  };

  const toQuestionPayload = (draft: QuestionDraft, sortOrder: number): ChallengeQuestionRequest => ({
  prompt: draft.prompt.trim(),
  type: draft.type,
  mediaType: draft.mediaType,
  mediaUrl: draft.mediaType === 'NONE' ? '' : draft.mediaUrl,
  points: normalizeQuestionPoints(draft.points),
  sortOrder,
  choices: draft.type === 'MULTIPLE_CHOICE'
      ? draft.choices
          .filter((choice) => choice.text.trim())
          .map((choice, index) => ({ text: choice.text.trim(), isCorrect: choice.isCorrect, sortOrder: index }))
      : [],
  });

  const handleSaveQuestionSet = async () => {
    if (!id) return;
    const validDrafts = validateDrafts();
    if (!validDrafts) return;
    setSaving(true);
    try {
      const setPayload = {
        title: setTitle.trim(),
        timeLimitMinutes: setTimeLimit === '' ? null : Number(setTimeLimit),
        sortOrder: questionSet?.sortOrder ?? 0,
      };
      const savedSet = questionSet
        ? await updateQuestionSet(id, questionSet.id, setPayload)
        : await createQuestionSet(id, setPayload);

      const currentQuestionIds = new Set(validDrafts.flatMap((draft) => (draft.id ? [draft.id] : [])));
      const deletedQuestionIds = persistedQuestionIds.filter((questionId) => !currentQuestionIds.has(questionId));
      for (const questionId of deletedQuestionIds) {
        await deleteQuestion(savedSet.challengeId, questionId);
      }

      for (let index = 0; index < validDrafts.length; index++) {
        const draft = validDrafts[index];
        const payload = toQuestionPayload(draft, index);
        if (draft.id) {
          await updateQuestion(savedSet.challengeId, draft.id, payload);
        } else {
          await addQuestionToSet(savedSet.id, payload);
        }
      }

      showToast('Đã lưu tập câu hỏi.', 'success');
      navigate(`/challenges/${id}`);
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Lưu tập câu hỏi thất bại', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteQuestionSet = async () => {
    if (!id) return;
    const confirmed = await confirm({
      title: 'Xóa tập câu hỏi',
      message: 'Toàn bộ thông tin trong tập câu hỏi này sẽ bị xóa khi bạn xác nhận.',
      confirmLabel: 'Xóa tập câu hỏi',
      cancelLabel: 'Hủy',
      variant: 'danger',
    });
    if (!confirmed) return;
    setSaving(true);
    try {
      if (questionSet) {
        await deleteQuestionSet(id, questionSet.id);
      }
      showToast('Đã xóa tập câu hỏi.', 'success');
      navigate(`/challenges/${id}`);
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Xóa tập câu hỏi thất bại', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (!challenge || !activeDraft) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <button onClick={() => navigate(`/challenges/${challenge.id}`)} className="flex items-center gap-2 text-slate-600 transition-colors hover:text-slate-900">
        <ArrowLeft className="h-5 w-5" />
        Quay lại chi tiết thử thách
      </button>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Soạn tập câu hỏi</h1>
          <p className="mt-1 text-slate-500">Tạo một tập câu hỏi gồm nhiều câu trắc nghiệm và tự luận cho thử thách.</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button type="button" variant="secondary" onClick={handleDeleteQuestionSet} disabled={saving}>
            <Trash2 className="mr-2 h-4 w-4" />
            Xóa tập câu hỏi
          </Button>
          <Button type="button" onClick={handleSaveQuestionSet} isLoading={saving}>
            <Save className="mr-2 h-4 w-4" />
            Lưu tập câu hỏi
          </Button>
        </div>
      </div>

      <Card>
        <CardBody className="grid gap-4 md:grid-cols-[1fr_220px] md:items-end">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Tiêu đề tập câu hỏi</label>
            <input
              value={setTitle}
              onChange={(event) => setSetTitle(event.target.value)}
              placeholder="VD: Vòng kiến thức nền tảng"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Thời gian (phút)</label>
            <input
              type="number"
              min={0}
              value={setTimeLimit}
              onChange={(event) => setSetTimeLimit(event.target.value === '' ? '' : Number(event.target.value))}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
            />
          </div>
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 gap-8 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardBody className="space-y-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Loại câu hỏi</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => patchActiveDraft({ type: 'MULTIPLE_CHOICE', choices: activeDraft.choices.length >= 2 ? activeDraft.choices : blankChoices() })}
                    className={`flex items-center justify-center gap-2 rounded-xl border-2 p-3 text-sm font-medium transition ${activeDraft.type === 'MULTIPLE_CHOICE' ? 'border-violet-500 bg-violet-50 text-violet-700' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}
                  >
                    <ListChecks className="h-4 w-4" />
                    Trắc nghiệm
                  </button>
                  <button
                    type="button"
                    onClick={() => patchActiveDraft({ type: 'ESSAY' })}
                    className={`flex items-center justify-center gap-2 rounded-xl border-2 p-3 text-sm font-medium transition ${activeDraft.type === 'ESSAY' ? 'border-violet-500 bg-violet-50 text-violet-700' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}
                  >
                    <FileText className="h-4 w-4" />
                    Tự luận
                  </button>
                </div>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Điểm</label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={activeDraft.points}
                  onChange={(event) => {
                    const digitsOnly = event.target.value.replace(/\D/g, '');
                    patchActiveDraft({ points: digitsOnly === '' ? '' : Number(digitsOnly) });
                  }}
                  onBlur={() => patchActiveDraft({ points: normalizeQuestionPoints(activeDraft.points) })}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Câu hỏi <span className="text-red-500">*</span></label>
              <textarea
                rows={4}
                value={activeDraft.prompt}
                onChange={(event) => patchActiveDraft({ prompt: event.target.value })}
                placeholder="Nhập nội dung câu hỏi..."
                className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Media</label>
                <select
                  value={activeDraft.mediaType}
                  onChange={(event) => patchActiveDraft({ mediaType: event.target.value as QuestionMediaType })}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
                >
                  <option value="NONE">Không có</option>
                  <option value="IMAGE">Hình ảnh</option>
                  <option value="VIDEO">Video</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-slate-700">URL hình ảnh/video</label>
                <input
                  type="url"
                  disabled={activeDraft.mediaType === 'NONE'}
                  value={activeDraft.mediaUrl}
                  onChange={(event) => patchActiveDraft({ mediaUrl: event.target.value })}
                  placeholder="https://..."
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none disabled:bg-slate-50 disabled:text-slate-400 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
                />
              </div>
            </div>

            {activeDraft.mediaType === 'IMAGE' && mediaUrl && (
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                <img
                  src={mediaUrl}
                  alt="Xem trước media của câu hỏi"
                  className="max-h-96 w-full object-contain"
                />
              </div>
            )}

            {activeDraft.mediaType === 'VIDEO' && mediaUrl && (
              youtubeEmbedUrl ? (
                <div className="aspect-video overflow-hidden rounded-xl bg-slate-900">
                  <iframe
                    src={youtubeEmbedUrl}
                    title="Xem trước video câu hỏi"
                    className="h-full w-full"
                    allowFullScreen
                  />
                </div>
              ) : (
                <div className="rounded-xl border border-amber-100 bg-amber-50 p-4 text-sm text-amber-700">
                  Hiện tại phần video chỉ hỗ trợ URL YouTube.
                </div>
              )
            )}

            {activeDraft.type === 'MULTIPLE_CHOICE' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-slate-700">Câu trả lời</label>
                  <Button type="button" size="sm" variant="secondary" onClick={() => patchActiveDraft({ choices: [...activeDraft.choices, { text: '', isCorrect: false }] })}>
                    <Plus className="mr-1 h-4 w-4" />
                    Thêm đáp án
                  </Button>
                </div>
                {activeDraft.choices.map((choice, index) => (
                  <div key={index} className="flex gap-3">
                    <input
                      value={choice.text}
                      onChange={(event) => updateChoice(index, { text: event.target.value })}
                      placeholder={`Đáp án ${index + 1}`}
                      className="flex-1 rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
                    />
                    <button
                      type="button"
                      onClick={() => updateChoice(index, { isCorrect: true })}
                      className={`rounded-xl border px-4 text-sm font-medium transition ${choice.isCorrect ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                    >
                      Đúng
                    </button>
                    {activeDraft.choices.length > 2 && (
                      <button
                        type="button"
                        onClick={() => patchActiveDraft({ choices: activeDraft.choices.filter((_, choiceIndex) => choiceIndex !== index) })}
                        className="rounded-xl border border-rose-200 px-3 text-rose-600 hover:bg-rose-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {activeDraft.type === 'ESSAY' && (
              <div className="rounded-xl border border-sky-100 bg-sky-50 p-4 text-sm text-sky-700">
                Học viên có thể trả lời bằng text hoặc chọn file local để demo upload. File chưa được lưu vào server.
              </div>
            )}

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button type="button" variant="secondary" className="flex-1 justify-center" onClick={() => goToAdjacentQuestion('before')}>
                <ChevronLeft className="mr-2 h-4 w-4" />
                Câu trước
              </Button>
              <Button type="button" variant="secondary" className="flex-1 justify-center" onClick={() => goToAdjacentQuestion('after')}>
                Câu sau
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardBody>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardBody className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-bold text-slate-800">Ma trận câu hỏi</h2>
                <Button type="button" size="sm" variant="secondary" onClick={addQuestionAfterCurrent}>
                  <Plus className="mr-1 h-4 w-4" />
                  Thêm câu hỏi
                </Button>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {drafts.map((draft, index) => (
                  <button
                    key={draft.localId}
                    type="button"
                    onClick={() => setActiveLocalId(draft.localId)}
                    className={`aspect-square rounded-xl border text-sm font-semibold transition ${draft.localId === activeLocalId ? 'border-violet-500 bg-violet-50 text-violet-700' : 'border-slate-200 text-slate-600 hover:border-violet-200 hover:bg-violet-50/60'}`}
                    title={draft.prompt || `Câu ${index + 1}`}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="space-y-3">
              <h2 className="text-lg font-bold text-slate-800">Danh sách câu hỏi</h2>
              {drafts.map((draft, index) => (
                <div
                  key={draft.localId}
                  role="button"
                  tabIndex={0}
                  onClick={() => setActiveLocalId(draft.localId)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      setActiveLocalId(draft.localId);
                    }
                  }}
                  className={`rounded-xl border p-3 text-left transition hover:border-violet-200 hover:bg-violet-50/50 ${draft.localId === activeLocalId ? 'border-violet-300 bg-violet-50' : 'border-slate-100 bg-white'}`}
                >
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <div>
                      <div className="text-sm font-semibold text-slate-800">Câu {index + 1}</div>
                      <p className="line-clamp-2 text-sm text-slate-500">{draft.prompt || 'Câu hỏi chưa có nội dung'}</p>
                    </div>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        removeDraft(draft).catch((error) => showToast(error instanceof Error ? error.message : 'Xóa câu hỏi thất bại', 'error'));
                      }}
                      className="rounded-lg p-2 text-rose-500 hover:bg-rose-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant={draft.type === 'ESSAY' ? 'info' : 'brand'}>
                      {draft.type === 'ESSAY' ? 'Tự luận' : 'Trắc nghiệm'}
                    </Badge>
                    {draft.mediaType === 'IMAGE' && <Badge variant="neutral"><ImageIcon className="mr-1 h-3 w-3" />Ảnh</Badge>}
                    {draft.mediaType === 'VIDEO' && <Badge variant="neutral"><Video className="mr-1 h-3 w-3" />Video</Badge>}
                  </div>
                </div>
              ))}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
