import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Badge, Card, CardBody } from '@/components/ui';
import { useToast } from '@/components/Toast';
import { useChallengeAttempt } from '@/hooks';
import type { ChallengeAttemptResult } from '@/types/challenge';
import { ArrowLeft, CheckCircle2, Clock, XCircle } from 'lucide-react';

function formatDuration(startedAt: string, submittedAt: string | null) {
  if (!submittedAt) return 'Chưa nộp';
  const durationSeconds = Math.max(0, Math.floor((new Date(submittedAt).getTime() - new Date(startedAt).getTime()) / 1000));
  const hours = Math.floor(durationSeconds / 3600);
  const minutes = Math.floor((durationSeconds % 3600) / 60);
  const seconds = durationSeconds % 60;
  if (hours > 0) {
    return `${hours} giờ ${minutes} phút ${seconds} giây`;
  }
  return `${minutes} phút ${seconds} giây`;
}

function answerBadge(isCorrect: boolean | null) {
  if (isCorrect === null) {
    return (
      <Badge variant="warning">
        <Clock className="mr-1 h-3 w-3" />
        Chờ chấm
      </Badge>
    );
  }

  if (isCorrect) {
    return (
      <Badge variant="success">
        <CheckCircle2 className="mr-1 h-3 w-3" />
        Đúng
      </Badge>
    );
  }

  return (
    <Badge variant="error">
      <XCircle className="mr-1 h-3 w-3" />
      Sai
    </Badge>
  );
}

export default function QuestionResultPage() {
  const { id, attemptId } = useParams<{ id: string; attemptId: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { getAttemptResult } = useChallengeAttempt();
  const [result, setResult] = useState<ChallengeAttemptResult | null>(null);

  useEffect(() => {
    if (!attemptId) return;
    let ignore = false;

    getAttemptResult(attemptId)
      .then((response) => {
        if (!ignore) {
          setResult(response);
        }
      })
      .catch((error) => {
        if (!ignore) {
          showToast(error instanceof Error ? error.message : 'Không tải được kết quả', 'error');
        }
      });

    return () => {
      ignore = true;
    };
  }, [attemptId, getAttemptResult, showToast]);

  if (!result) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-500 border-t-transparent" />
      </div>
    );
  }

  const totalPoints = result.answers.reduce((sum, answer) => sum + Number(answer.points || 1), 0);
  const earnedPoints = result.answers.reduce(
    (sum, answer) => sum + (answer.isCorrect ? Number(answer.points || 1) : 0),
    0,
  );
  const score = result.score ?? (totalPoints > 0 ? (earnedPoints / totalPoints) * 10 : 0);
  const hasScore = result.score !== null;
  const durationLabel = formatDuration(result.startedAt, result.submittedAt);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <button onClick={() => navigate(`/challenges/${id}?tab=results`)} className="flex items-center gap-2 text-slate-600 hover:text-slate-900">
        <ArrowLeft className="h-5 w-5" />
        Quay lại kết quả
      </button>

      <Card>
        <CardBody className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Kết quả: {result.questionSetTitle}</h1>
            <p className="mt-1 text-sm text-slate-500">Thời gian làm bài: {durationLabel}</p>
            {result.gradedAt && (
              <p className="mt-1 text-sm text-slate-500">Chấm lúc: {new Date(result.gradedAt).toLocaleString('vi-VN')}</p>
            )}
          </div>
          <div className="rounded-xl bg-violet-50 px-4 py-3 text-sm font-semibold text-violet-700">
            {hasScore ? `${Number(score).toFixed(2)}/10 điểm` : 'Chờ giảng viên chấm'}
            {hasScore && (
              <div className="mt-1 text-xs font-medium text-violet-500">
                {earnedPoints}/{totalPoints} điểm câu hỏi
              </div>
            )}
          </div>
        </CardBody>
      </Card>

      <div className="space-y-4">
        {result.answers.map((answer, index) => {
          const selectedChoiceIsWrong = answer.type === 'MULTIPLE_CHOICE' && answer.selectedChoiceText && !answer.isCorrect;
          const choices = answer.choices || [];
          const hasChoices = answer.type === 'MULTIPLE_CHOICE' && choices.length > 0;
          return (
            <Card key={answer.questionId}>
              <CardBody className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <Badge variant={answer.type === 'ESSAY' ? 'info' : 'brand'}>
                      {answer.type === 'ESSAY' ? 'Tự luận' : 'Trắc nghiệm'}
                    </Badge>
                    <h2 className="mt-3 text-lg font-bold text-slate-800">
                      Câu {index + 1}: {answer.questionTitle || answer.prompt}
                    </h2>
                    {answer.questionTitle && <p className="mt-2 text-slate-600">{answer.prompt}</p>}
                    <p className="mt-2 text-sm font-medium text-slate-500">{answer.points} điểm</p>
                  </div>
                  <div className="shrink-0">{answerBadge(answer.isCorrect)}</div>
                </div>

                {answer.type === 'MULTIPLE_CHOICE' ? hasChoices ? (
                  <div className="space-y-3">
                    {choices.map((choice) => {
                      const isSelected = choice.id === answer.selectedChoiceId;
                      const isCorrect = Boolean(choice.isCorrect);
                      const isWrongSelection = isSelected && !isCorrect;
                      return (
                        <div
                          key={choice.id}
                          className={`flex items-center justify-between gap-3 rounded-xl border p-4 ${
                            isCorrect
                              ? 'border-emerald-200 bg-emerald-50'
                              : isWrongSelection
                                ? 'border-rose-200 bg-rose-50'
                                : 'border-slate-200 bg-white'
                          }`}
                        >
                          <p className={`min-w-0 text-slate-700 ${isCorrect ? 'font-medium text-emerald-800' : ''}`}>
                            {choice.text}
                          </p>
                          <div className="flex shrink-0 flex-wrap justify-end gap-2">
                            {isSelected && (
                              <Badge variant={isWrongSelection ? 'error' : 'success'}>Bạn chọn</Badge>
                            )}
                            {isCorrect && <Badge variant="success">Đáp án đúng</Badge>}
                          </div>
                        </div>
                      );
                    })}
                    {!answer.selectedChoiceId && (
                      <div className="rounded-xl border border-slate-200 p-4 text-sm font-medium text-slate-500">
                        Bạn chưa chọn đáp án.
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className={`rounded-xl border p-4 ${selectedChoiceIsWrong ? 'border-rose-200 bg-rose-50' : 'border-slate-200'}`}>
                      <div className={`text-xs font-semibold uppercase ${selectedChoiceIsWrong ? 'text-rose-500' : 'text-slate-400'}`}>
                        {selectedChoiceIsWrong ? 'Đáp án sai' : 'Bạn chọn'}
                      </div>
                      <p className="mt-2 text-slate-700">{answer.selectedChoiceText || 'Chưa chọn đáp án'}</p>
                    </div>
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                      <div className="text-xs font-semibold uppercase text-emerald-500">Đáp án đúng</div>
                      <p className="mt-2 text-emerald-800">{answer.correctChoiceText || 'Chưa có đáp án đúng'}</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="rounded-xl border border-slate-200 p-4">
                      <div className="text-xs font-semibold uppercase text-slate-400">Câu trả lời tự luận</div>
                      <p className="mt-2 whitespace-pre-wrap text-slate-700">{answer.textAnswer || 'Bạn chưa nhập câu trả lời text.'}</p>
                    </div>
                    {answer.fileName && (
                      <div className="rounded-xl border border-slate-200 p-4 text-sm text-slate-600">
                        File demo: <strong>{answer.fileName}</strong> {answer.fileSize ? `(${Math.round(answer.fileSize / 1024)} KB)` : ''}
                      </div>
                    )}
                  </div>
                )}
              </CardBody>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
