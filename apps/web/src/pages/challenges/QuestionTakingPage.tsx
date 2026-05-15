import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Badge, Button, Card, CardBody } from '@/components/ui';
import { useToast } from '@/components/Toast';
import { useChallengeAttempt, useChallenges } from '@/hooks';
import type { ChallengeQuestion, ChallengeQuestionSet, SubmitChallengeAnswerRequest } from '@/types/challenge';
import { ArrowLeft, FileUp, RotateCcw, Send, Timer } from 'lucide-react';

interface DraftAnswer {
  choiceId?: string;
  textAnswer?: string;
  file?: File;
}

function formatRemainingTime(totalSeconds: number) {
  const safeSeconds = Math.max(0, totalSeconds);
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export default function QuestionTakingPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const requestedAttemptId = searchParams.get('attemptId') || '';
  const requestedQuestionSetId = searchParams.get('questionSetId') || '';
  const requestedStartedAt = searchParams.get('startedAt') || '';
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { fetchQuestionSet } = useChallenges();
  const { startQuestionSetAttempt, submitAttempt, loading } = useChallengeAttempt();
  const [questionSet, setQuestionSet] = useState<ChallengeQuestionSet | null>(null);
  const [questions, setQuestions] = useState<ChallengeQuestion[]>([]);
  const [attemptId, setAttemptId] = useState(requestedAttemptId);
  const [startedAt, setStartedAt] = useState(requestedStartedAt);
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const [answers, setAnswers] = useState<Record<string, DraftAnswer>>({});
  const answersRef = useRef(answers);
  const hasSubmittedRef = useRef(false);

  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  useEffect(() => {
    if (!id || !requestedQuestionSetId) {
      showToast('Thiếu thông tin tập câu hỏi.', 'error');
      return;
    }
    let ignore = false;
    fetchQuestionSet(id, requestedQuestionSetId)
      .then(async (detail) => {
        if (ignore) return;
        setQuestionSet(detail.questionSet);
        setQuestions(detail.questions);
        if (requestedAttemptId) {
          setAttemptId(requestedAttemptId);
          setStartedAt(requestedStartedAt || new Date().toISOString());
          return;
        }
        const attempt = await startQuestionSetAttempt(requestedQuestionSetId);
        if (!ignore) {
          setAttemptId(attempt.id);
          setStartedAt(attempt.startedAt);
        }
      })
      .catch((error) => showToast(error instanceof Error ? error.message : 'Không thể mở tập câu hỏi', 'error'));

    return () => {
      ignore = true;
    };
  }, [fetchQuestionSet, id, requestedAttemptId, requestedQuestionSetId, requestedStartedAt, showToast, startQuestionSetAttempt]);

  const submit = useCallback(async (options?: { timeExpired?: boolean }) => {
    if (!attemptId || !id) return;
    if (hasSubmittedRef.current) return;
    hasSubmittedRef.current = true;
    const currentAnswers = answersRef.current;
    const payload: SubmitChallengeAnswerRequest[] = questions.map((question) => {
      const answer = currentAnswers[question.id] || {};
      return {
        questionId: question.id,
        choiceId: answer.choiceId,
        textAnswer: answer.textAnswer,
        fileName: answer.file?.name,
        fileType: answer.file?.type || undefined,
        fileSize: answer.file?.size,
        fileUrl: answer.file ? `demo-local://${answer.file.name}` : undefined,
      };
    });
    try {
      await submitAttempt(attemptId, payload);
      showToast(
        options?.timeExpired
          ? 'Đã hết thời gian. Hệ thống đã tự động nộp bài.'
          : 'Đã nộp bài. Giảng viên sẽ chấm điểm sau.',
        options?.timeExpired ? 'warning' : 'success',
      );
      navigate(`/challenges/${id}`);
    } catch (error) {
      hasSubmittedRef.current = false;
      showToast(error instanceof Error ? error.message : 'Nộp bài thất bại', 'error');
    }
  }, [attemptId, id, navigate, questions, showToast, submitAttempt]);

  useEffect(() => {
    if (!questionSet?.timeLimitMinutes || !startedAt || !attemptId) {
      return;
    }

    const endsAt = new Date(startedAt).getTime() + questionSet.timeLimitMinutes * 60 * 1000;
    const tick = () => {
      const secondsLeft = Math.ceil((endsAt - Date.now()) / 1000);
      const nextRemaining = Math.max(0, secondsLeft);
      setRemainingSeconds(nextRemaining);
      if (nextRemaining <= 0) {
        submit({ timeExpired: true });
      }
    };

    tick();
    const intervalId = window.setInterval(tick, 1000);
    return () => window.clearInterval(intervalId);
  }, [attemptId, questionSet?.timeLimitMinutes, startedAt, submit]);

  if (!questionSet) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <button onClick={() => navigate(`/challenges/${id}`)} className="flex items-center gap-2 text-slate-600 hover:text-slate-900">
        <ArrowLeft className="h-5 w-5" />
        Thoát thử thách
      </button>

      <Card>
        <CardBody className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{questionSet.title}</h1>
            <p className="mt-1 text-sm text-slate-500">Hoàn thành các câu hỏi rồi nộp bài để giảng viên chấm điểm.</p>
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-violet-50 px-4 py-3 text-violet-700">
            <Timer className="h-5 w-5" />
            {questionSet.timeLimitMinutes
              ? (remainingSeconds !== null ? formatRemainingTime(remainingSeconds) : `${questionSet.timeLimitMinutes} phút`)
              : 'Không giới hạn'}
          </div>
        </CardBody>
      </Card>

      <div className="space-y-4">
        {questions.map((question, index) => (
          <div key={question.id} id={`challenge-question-${question.id}`}>
            <Card>
              <CardBody className="space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <Badge variant={question.type === 'ESSAY' ? 'info' : 'brand'}>
                      {question.type === 'ESSAY' ? 'Tự luận' : 'Trắc nghiệm'}
                    </Badge>
                    <h2 className="mt-3 text-lg font-bold text-slate-800">
                      Câu {index + 1}: {question.title || question.prompt}
                    </h2>
                    {question.title && <p className="mt-2 text-slate-600">{question.prompt}</p>}
                  </div>
                  <span className="text-sm font-medium text-slate-500">{question.points} điểm</span>
                </div>

                {question.mediaType === 'IMAGE' && question.mediaUrl && (
                  <div className="flex w-full justify-center rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <img
                      src={question.mediaUrl}
                      alt={question.title || question.prompt}
                      className="max-h-[560px] w-full rounded-lg object-contain"
                    />
                  </div>
                )}
                {question.mediaType === 'VIDEO' && question.mediaUrl && (
                  <div className="aspect-video overflow-hidden rounded-xl bg-slate-900">
                    <iframe
                      src={question.mediaUrl.replace('watch?v=', 'embed/').replace('youtu.be/', 'www.youtube.com/embed/')}
                      title={question.title || question.prompt}
                      className="h-full w-full"
                      allowFullScreen
                    />
                  </div>
                )}

                {question.type === 'MULTIPLE_CHOICE' ? (
                  <div className="space-y-2">
                    {question.choices.map((choice) => (
                      <label key={choice.id} className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 p-4 transition hover:bg-slate-50">
                        <input
                          type="radio"
                          name={question.id}
                          checked={answers[question.id]?.choiceId === choice.id}
                          onChange={() => setAnswers({ ...answers, [question.id]: { ...answers[question.id], choiceId: choice.id } })}
                          className="h-4 w-4 accent-violet-600"
                        />
                        <span className="text-slate-700">{choice.text}</span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <textarea
                      rows={5}
                      value={answers[question.id]?.textAnswer || ''}
                      onChange={(event) => setAnswers({ ...answers, [question.id]: { ...answers[question.id], textAnswer: event.target.value } })}
                      placeholder="Nhập câu trả lời tự luận..."
                      className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
                    />
                    <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 p-6 text-center transition hover:border-violet-400">
                      <FileUp className="mb-2 h-8 w-8 text-slate-400" />
                      <span className="text-sm font-medium text-slate-700">Chọn file từ máy local</span>
                      <span className="mt-1 text-xs text-slate-500">Demo upload: pdf, docx, code, zip...</span>
                      <input
                        type="file"
                        className="hidden"
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          if (file) setAnswers({ ...answers, [question.id]: { ...answers[question.id], file } });
                        }}
                      />
                    </label>
                    {answers[question.id]?.file && (
                      <div className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
                        File: <strong>{answers[question.id].file?.name}</strong> ({Math.round((answers[question.id].file?.size || 0) / 1024)} KB)
                      </div>
                    )}
                  </div>
                )}
              </CardBody>
            </Card>
          </div>
        ))}
      </div>

      <div className="sticky bottom-4 flex flex-col justify-end gap-3 sm:flex-row">
        <Button type="button" variant="secondary" onClick={() => setAnswers({})}>
          <RotateCcw className="mr-2 h-4 w-4" />
          Xóa tất cả câu trả lời
        </Button>
        <Button onClick={() => submit()} isLoading={loading} className="gap-2 shadow-lg shadow-violet-500/25">
          <Send className="h-4 w-4" />
          Nộp bài
        </Button>
      </div>
    </div>
  );
}
