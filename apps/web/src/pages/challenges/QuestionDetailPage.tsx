import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
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
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Copy,
  FileText,
  GripVertical,
  HelpCircle,
  Image as ImageIcon,
  ListChecks,
  Plus,
  Save,
  Trash2,
  Upload,
  Video,
} from 'lucide-react';

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

interface ImportedQuestionJson {
  type?: unknown;
  text?: unknown;
  prompt?: unknown;
  points?: unknown;
  options?: unknown;
  choices?: unknown;
  correctOptionIndex?: unknown;
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

const cloneDraft = (draft: QuestionDraft): QuestionDraft => ({
  ...draft,
  localId: crypto.randomUUID(),
  id: undefined,
  prompt: draft.prompt ? `${draft.prompt} (bản sao)` : draft.prompt,
  choices: draft.choices.map((choice) => ({ ...choice })),
});

const normalizeQuestionPoints = (points: number | '') => {
  if (points === '' || !Number.isFinite(points) || points <= 0 || points >= 100) {
    return 1;
  }
  return points;
};

const normalizeImportPoints = (value: unknown) => {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0 || value >= 100) {
    return 1;
  }
  return value;
};

const toChoiceText = (value: unknown) => {
  if (typeof value === 'string') return value.trim();
  if (value && typeof value === 'object' && 'text' in value && typeof value.text === 'string') {
    return value.text.trim();
  }
  return '';
};

function parseImportedQuestions(input: unknown): { drafts: QuestionDraft[]; errors: string[] } {
  if (!Array.isArray(input)) {
    return { drafts: [], errors: ['File JSON phải là một mảng câu hỏi.'] };
  }

  const errors: string[] = [];
  const drafts: QuestionDraft[] = [];

  input.forEach((rawItem, index) => {
    const item = rawItem as ImportedQuestionJson;
    const rowLabel = `Câu ${index + 1}`;
    if (!item || typeof item !== 'object') {
      errors.push(`${rowLabel}: dữ liệu câu hỏi không hợp lệ.`);
      return;
    }

    const type = item.type;
    if (type !== 'MULTIPLE_CHOICE' && type !== 'ESSAY') {
      errors.push(`${rowLabel}: type phải là MULTIPLE_CHOICE hoặc ESSAY.`);
      return;
    }

    const prompt = typeof item.text === 'string'
      ? item.text.trim()
      : typeof item.prompt === 'string'
        ? item.prompt.trim()
        : '';
    if (!prompt) {
      errors.push(`${rowLabel}: thiếu text hoặc prompt.`);
      return;
    }

    const draft: QuestionDraft = {
      localId: crypto.randomUUID(),
      type,
      prompt,
      mediaType: 'NONE',
      mediaUrl: '',
      points: normalizeImportPoints(item.points),
      choices: blankChoices(),
    };

    if (type === 'MULTIPLE_CHOICE') {
      const rawOptions = Array.isArray(item.options)
        ? item.options
        : Array.isArray(item.choices)
          ? item.choices
          : [];
      const options = rawOptions.map(toChoiceText).filter(Boolean);
      if (options.length < 2) {
        errors.push(`${rowLabel}: câu trắc nghiệm cần ít nhất 2 đáp án trong options.`);
        return;
      }
      if (
        typeof item.correctOptionIndex !== 'number' ||
        !Number.isInteger(item.correctOptionIndex) ||
        item.correctOptionIndex < 0 ||
        item.correctOptionIndex >= options.length
      ) {
        errors.push(`${rowLabel}: correctOptionIndex phải nằm trong khoảng 0 đến ${options.length - 1}.`);
        return;
      }
      draft.choices = options.map((text, optionIndex) => ({
        text,
        isCorrect: optionIndex === item.correctOptionIndex,
      }));
    }

    drafts.push(draft);
  });

  return { drafts, errors };
}

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
  const [showImportGuide, setShowImportGuide] = useState(false);
  const [pastedJson, setPastedJson] = useState('');
  const [draggingLocalId, setDraggingLocalId] = useState<string | null>(null);
  const importInputRef = useRef<HTMLInputElement>(null);

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

  const duplicateActiveQuestion = () => {
    if (!activeDraft || !activeDraft.prompt.trim()) {
      showToast('Vui lòng nhập nội dung câu hỏi trước khi nhân bản.', 'warning');
      return;
    }
    const duplicatedDraft = cloneDraft(activeDraft);
    const insertIndex = activeIndex >= 0 ? activeIndex + 1 : drafts.length;
    setDrafts((prev) => [
      ...prev.slice(0, insertIndex),
      duplicatedDraft,
      ...prev.slice(insertIndex),
    ]);
    setPendingDraft(null);
    setActiveLocalId(duplicatedDraft.localId);
    showToast('Đã nhân bản câu hỏi.', 'success');
  };

  const moveDraft = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0 || fromIndex >= drafts.length || toIndex >= drafts.length) {
      return;
    }
    setDrafts((prev) => {
      const next = [...prev];
      const [movedDraft] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, movedDraft);
      return next;
    });
  };

  const handleImportJson = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.json')) {
      showToast('Vui lòng chọn file .json.', 'error');
      return;
    }

    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as unknown;
      const result = parseImportedQuestions(parsed);
      if (result.errors.length > 0) {
        showToast(result.errors.slice(0, 3).join(' '), 'error');
        return;
      }
      if (result.drafts.length === 0) {
        showToast('File JSON chưa có câu hỏi hợp lệ.', 'error');
        return;
      }
      setDrafts((prev) => [...prev, ...result.drafts]);
      setPendingDraft(null);
      setActiveLocalId(result.drafts[0].localId);
      showToast(`Đã import ${result.drafts.length} câu hỏi từ JSON.`, 'success');
    } catch {
      showToast('Không đọc được file JSON. Kiểm tra lại dấu phẩy, ngoặc vuông và ngoặc nhọn.', 'error');
    }
  };

  const importQuestionsFromJsonText = (jsonText: string) => {
    if (!jsonText.trim()) {
      showToast('Vui lòng paste JSON câu hỏi trước khi import.', 'warning');
      return false;
    }

    try {
      const parsed = JSON.parse(jsonText) as unknown;
      const result = parseImportedQuestions(parsed);
      if (result.errors.length > 0) {
        showToast(result.errors.slice(0, 3).join(' '), 'error');
        return false;
      }
      if (result.drafts.length === 0) {
        showToast('JSON chưa có câu hỏi hợp lệ.', 'error');
        return false;
      }
      setDrafts((prev) => [...prev, ...result.drafts]);
      setPendingDraft(null);
      setActiveLocalId(result.drafts[0].localId);
      showToast(`Đã import ${result.drafts.length} câu hỏi từ JSON.`, 'success');
      return true;
    } catch {
      showToast('JSON không hợp lệ. Kiểm tra lại dấu phẩy, ngoặc vuông và ngoặc nhọn.', 'error');
      return false;
    }
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
          <input
            ref={importInputRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={handleImportJson}
          />
          <Button type="button" variant="secondary" onClick={() => setShowImportGuide(true)} disabled={saving}>
            <HelpCircle className="mr-2 h-4 w-4" />
            Hướng dẫn JSON
          </Button>
          <Button type="button" variant="secondary" onClick={() => importInputRef.current?.click()} disabled={saving}>
            <Upload className="mr-2 h-4 w-4" />
            Import JSON
          </Button>
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
              <Button type="button" variant="secondary" className="flex-1 justify-center" onClick={duplicateActiveQuestion}>
                <Copy className="mr-2 h-4 w-4" />
                Nhân bản câu hỏi
              </Button>
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
                  draggable
                  onDragStart={() => setDraggingLocalId(draft.localId)}
                  onDragEnd={() => setDraggingLocalId(null)}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => {
                    event.preventDefault();
                    const fromIndex = drafts.findIndex((item) => item.localId === draggingLocalId);
                    moveDraft(fromIndex, index);
                    setDraggingLocalId(null);
                  }}
                  onClick={() => setActiveLocalId(draft.localId)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      setActiveLocalId(draft.localId);
                    }
                  }}
                  className={`rounded-xl border p-3 text-left transition hover:border-violet-200 hover:bg-violet-50/50 ${draggingLocalId === draft.localId ? 'opacity-60 ring-2 ring-violet-200' : ''} ${draft.localId === activeLocalId ? 'border-violet-300 bg-violet-50' : 'border-slate-100 bg-white'}`}
                >
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                        <GripVertical className="h-4 w-4 text-slate-300" />
                        Câu {index + 1}
                      </div>
                      <p className="line-clamp-2 text-sm text-slate-500">{draft.prompt || 'Câu hỏi chưa có nội dung'}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        type="button"
                        disabled={index === 0}
                        onClick={(event) => {
                          event.stopPropagation();
                          moveDraft(index, index - 1);
                        }}
                        className="rounded-lg px-2 py-1 text-xs font-semibold text-slate-500 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Lên
                      </button>
                      <button
                        type="button"
                        disabled={index === drafts.length - 1}
                        onClick={(event) => {
                          event.stopPropagation();
                          moveDraft(index, index + 1);
                        }}
                        className="rounded-lg px-2 py-1 text-xs font-semibold text-slate-500 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Xuống
                      </button>
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
      {showImportGuide && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm" onClick={() => setShowImportGuide(false)} />
          <div className="relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Hướng dẫn import câu hỏi JSON</h2>
                <p className="mt-1 text-sm text-slate-500">
                  File chỉ chứa danh sách câu hỏi. Tiêu đề, thời gian và trạng thái thử thách vẫn nhập trong form.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowImportGuide(false)}
                className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <span className="sr-only">Đóng</span>
                ×
              </button>
            </div>

            <div className="space-y-5 p-6">
              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="font-semibold text-slate-800">Trắc nghiệm</div>
                  <p className="mt-1 text-sm text-slate-600">
                    Cần có type, text/prompt, points, options và correctOptionIndex. Index bắt đầu từ 0.
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="font-semibold text-slate-800">Tự luận</div>
                  <p className="mt-1 text-sm text-slate-600">
                    Chỉ cần type, text/prompt và points. Đáp án tự luận sẽ được giảng viên chấm sau.
                  </p>
                </div>
              </div>

              <pre className="overflow-x-auto rounded-xl bg-slate-950 p-4 text-sm leading-6 text-slate-100">
{`[
  {
    "type": "MULTIPLE_CHOICE",
    "text": "Hook nào dùng để quản lý state trong React?",
    "points": 1,
    "options": [
      "useEffect",
      "useState",
      "useMemo",
      "useRef"
    ],
    "correctOptionIndex": 1
  },
  {
    "type": "ESSAY",
    "text": "Giải thích sự khác nhau giữa props và state.",
    "points": 3
  }
]`}
              </pre>

              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <label className="text-sm font-semibold text-slate-700">Paste JSON câu hỏi</label>
                  <button
                    type="button"
                    onClick={() => setPastedJson('')}
                    className="text-sm font-medium text-slate-500 transition hover:text-slate-800"
                  >
                    Xóa nội dung
                  </button>
                </div>
                <textarea
                  rows={10}
                  value={pastedJson}
                  onChange={(event) => setPastedJson(event.target.value)}
                  placeholder="Paste mảng JSON câu hỏi vào đây..."
                  className="w-full resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 font-mono text-sm outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
                />
                <div className="mt-3 flex justify-end">
                  <Button
                    type="button"
                    onClick={() => {
                      const imported = importQuestionsFromJsonText(pastedJson);
                      if (imported) {
                        setPastedJson('');
                        setShowImportGuide(false);
                      }
                    }}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Import từ nội dung paste
                  </Button>
                </div>
              </div>

              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                Khi import thành công, hệ thống sẽ thêm các câu hỏi vào cuối danh sách hiện tại. Bạn vẫn có thể kéo thả, chỉnh sửa, nhân bản hoặc xóa từng câu trước khi lưu.
              </div>

              <div className="flex flex-col justify-between gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center">
                <div>
                  <div className="text-sm font-semibold text-slate-800">Hoặc import bằng file</div>
                  <p className="text-sm text-slate-500">Chọn file .json từ máy nếu bạn đã chuẩn bị sẵn.</p>
                </div>
                <div className="flex justify-end gap-3">
                <Button type="button" variant="secondary" onClick={() => setShowImportGuide(false)}>
                  Đóng
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    setShowImportGuide(false);
                    importInputRef.current?.click();
                  }}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Chọn file JSON
                </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
