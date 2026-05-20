import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Badge, Button, Card, CardBody, useConfirm } from '@/components/ui';
import { useToast } from '@/components/Toast';
import { useAssessmentAttempt } from '@/hooks';
import type { AssessmentAttemptResult } from '@/types/assessment';
import { ArrowLeft, Check, Save, Trash2, X } from 'lucide-react';

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

export default function QuestionReviewPage() {
  const { courseId, attemptId } = useParams<{ courseId: string; attemptId: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const confirm = useConfirm();
  const { getAttemptReview, gradeAttempt, deleteAttempt, loading } = useAssessmentAttempt();
  const [result, setResult] = useState<AssessmentAttemptResult | null>(null);
  const [grades, setGrades] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!attemptId) return;
    getAttemptReview(attemptId)
      .then((response) => {
        setResult(response);
        const initialGrades: Record<string, boolean> = {};
        response.answers.forEach((answer) => {
          initialGrades[answer.questionId] = Boolean(answer.isCorrect);
        });
        setGrades(initialGrades);
      })
      .catch((error) => showToast(error instanceof Error ? error.message : 'Không tải được bài nộp', 'error'));
  }, [attemptId, getAttemptReview, showToast]);

  const save = async () => {
    if (!attemptId || !result) return;
    try {
      const updated = await gradeAttempt(attemptId, {
        answers: result.answers.map((answer) => ({
          questionId: answer.questionId,
          isCorrect: Boolean(grades[answer.questionId]),
        })),
      });
      setResult(updated);
      showToast('Đã lưu điểm bài nộp.', 'success');
      navigate(`/courses/${courseId}?assessmentTab=submissions`);
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Lưu điểm thất bại', 'error');
    }
  };

  const removeAttempt = async () => {
    if (!attemptId || !result) return;
    const confirmed = await confirm({
      title: 'Xóa bài làm',
      message: `Bạn có chắc chắn muốn xóa bài làm của ${result.participantEmail || result.participantId}? Hành động này sẽ xóa câu trả lời và điểm đã chấm khỏi hệ thống.`,
      confirmLabel: 'Xóa bài làm',
      cancelLabel: 'Hủy',
      variant: 'danger',
    });
    if (!confirmed) return;

    try {
      await deleteAttempt(attemptId);
      showToast('Đã xóa bài làm của học viên.', 'success');
      navigate(`/courses/${courseId}?assessmentTab=submissions`);
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Xóa bài làm thất bại', 'error');
    }
  };

  if (!result) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-500 border-t-transparent" />
      </div>
    );
  }

  const totalPoints = result.answers.reduce((sum, answer) => sum + Number(answer.points || 1), 0);
  const earnedPoints = result.answers.reduce(
    (sum, answer) => sum + (grades[answer.questionId] ? Number(answer.points || 1) : 0),
    0,
  );
  const previewScore = totalPoints > 0 ? (earnedPoints / totalPoints) * 10 : 0;
  const durationLabel = formatDuration(result.startedAt, result.submittedAt);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <button onClick={() => navigate(`/courses/${courseId}?assessmentTab=submissions`)} className="flex items-center gap-2 text-slate-600 hover:text-slate-900">
        <ArrowLeft className="h-5 w-5" />
        Quay lại chi tiết thử thách
      </button>

      <Card>
        <CardBody className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Chấm điểm: {result.questionSetTitle}</h1>
            <p className="mt-1 text-sm text-slate-500">
              Học viên: {result.participantEmail || result.participantId}
            </p>
            <p className="mt-1 text-sm text-slate-500">Thời gian làm bài: {durationLabel}</p>
          </div>
          <div className="rounded-xl bg-violet-50 px-4 py-3 text-sm font-semibold text-violet-700">
            {previewScore.toFixed(2)}/10 điểm
            <div className="mt-1 text-xs font-medium text-violet-500">
              {earnedPoints}/{totalPoints} điểm câu hỏi
            </div>
          </div>
        </CardBody>
      </Card>

      <div className="space-y-4">
        {result.answers.map((answer, index) => {
          const currentGrade = Boolean(grades[answer.questionId]);
          const selectedChoiceIsWrong = answer.type === 'MULTIPLE_CHOICE' && answer.selectedChoiceText && !currentGrade;
          const choices = answer.choices || [];
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
                  <div className="flex shrink-0 gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant={currentGrade ? 'primary' : 'secondary'}
                      onClick={() => setGrades({ ...grades, [answer.questionId]: true })}
                    >
                      <Check className="h-4 w-4" />
                      Đúng
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={!currentGrade ? 'primary' : 'secondary'}
                      onClick={() => setGrades({ ...grades, [answer.questionId]: false })}
                    >
                      <X className="h-4 w-4" />
                      Sai
                    </Button>
                  </div>
                </div>

                {answer.type === 'MULTIPLE_CHOICE' ? choices.length > 0 ? (
                  <div className="space-y-3">
                    {choices.map((choice) => {
                      const isSelected = choice.id === answer.selectedChoiceId || choice.text === answer.selectedChoiceText;
                      const isCorrect = Boolean(choice.isCorrect)
                        || choice.id === answer.correctChoiceId
                        || choice.text === answer.correctChoiceText;
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
                          <div className="flex shrink-0 flex-wrap justify-end gap-3 text-sm font-semibold">
                            {isSelected && (
                              <span className={isWrongSelection ? 'text-rose-600' : 'text-emerald-700'}>
                                Học viên chọn
                              </span>
                            )}
                            {isCorrect && <span className="text-emerald-700">Đáp án đúng</span>}
                          </div>
                        </div>
                      );
                    })}
                    {!answer.selectedChoiceId && (
                      <div className="rounded-xl border border-slate-200 p-4 text-sm font-medium text-slate-500">
                        Học viên chưa chọn đáp án.
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className={`rounded-xl border p-4 ${selectedChoiceIsWrong ? 'border-rose-200 bg-rose-50' : 'border-slate-200'}`}>
                      <div className={`text-xs font-semibold uppercase ${selectedChoiceIsWrong ? 'text-rose-500' : 'text-slate-400'}`}>
                        {selectedChoiceIsWrong ? 'Đáp án sai' : 'Học viên chọn'}
                      </div>
                      <p className={`mt-2 text-slate-700`}>
                        {answer.selectedChoiceText || 'Chưa chọn đáp án'}
                      </p>
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
                      <p className="mt-2 whitespace-pre-wrap text-slate-700">{answer.textAnswer || 'Học viên chưa nhập câu trả lời text.'}</p>
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

      <div className="sticky bottom-4 flex justify-end gap-3">
        <Button type="button" variant="danger" onClick={removeAttempt} isLoading={loading} className="shadow-lg shadow-rose-500/25">
          <Trash2 className="mr-2 h-4 w-4" />
          Xóa bài làm
        </Button>
        <Button onClick={save} isLoading={loading} className="shadow-lg shadow-violet-500/25">
          <Save className="mr-2 h-4 w-4" />
          Lưu điểm
        </Button>
      </div>
    </div>
  );
}

