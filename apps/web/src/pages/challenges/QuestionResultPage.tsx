import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Badge, Card, CardBody } from '@/components/ui';
import { useToast } from '@/components/Toast';
import { useChallengeAttempt } from '@/hooks';
import type { ChallengeAttemptResult } from '@/types/challenge';
import { ArrowLeft, CheckCircle2, Clock3, Trophy, XCircle } from 'lucide-react';

export default function ChallengeResultPage() {
  const { id, attemptId } = useParams<{ id: string; attemptId: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { getAttemptResult } = useChallengeAttempt();
  const [result, setResult] = useState<ChallengeAttemptResult | null>(null);

  useEffect(() => {
    if (!attemptId) return;
    getAttemptResult(attemptId)
      .then(setResult)
      .catch((error) => showToast(error instanceof Error ? error.message : 'Không tải được kết quả', 'error'));
  }, [attemptId, getAttemptResult, showToast]);

  if (!result) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <button onClick={() => navigate(`/challenges/${id}`)} className="flex items-center gap-2 text-slate-600 hover:text-slate-900">
        <ArrowLeft className="h-5 w-5" />
        Quay lại thử thách
      </button>

      <Card>
        <CardBody className="text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-violet-100 to-cyan-100">
            <Trophy className="h-10 w-10 text-violet-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Kết quả thử thách</h1>
          <p className="mt-2 text-slate-500">Điểm tự động được tính cho phần trắc nghiệm.</p>
          <div className="mt-6 text-4xl font-bold text-violet-600">
            {result.score}/{result.maxScore}
          </div>
          <Badge variant={result.passed ? 'success' : 'warning'} className="mt-4">
            {result.passed ? 'Đạt' : 'Chưa đạt hoặc chờ chấm tự luận'}
          </Badge>
        </CardBody>
      </Card>

      <div className="space-y-4">
        {result.answers.map((answer, index) => (
          <Card key={answer.questionId}>
            <CardBody className="space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-bold text-slate-800">Câu {index + 1}: {answer.questionTitle || answer.prompt}</h2>
                  {answer.questionTitle && <p className="mt-1 text-sm text-slate-500">{answer.prompt}</p>}
                </div>
                {answer.type === 'ESSAY' ? (
                  <Badge variant="info"><Clock3 className="mr-1 h-3 w-3" />Chờ chấm</Badge>
                ) : answer.isCorrect ? (
                  <Badge variant="success"><CheckCircle2 className="mr-1 h-3 w-3" />Đúng</Badge>
                ) : (
                  <Badge variant="error"><XCircle className="mr-1 h-3 w-3" />Sai</Badge>
                )}
              </div>
              {answer.type === 'MULTIPLE_CHOICE' ? (
                <div className="grid gap-2 text-sm text-slate-600">
                  <div>Bạn chọn: <strong>{answer.selectedChoiceText || 'Chưa chọn'}</strong></div>
                  <div>Đáp án đúng: <strong>{answer.correctChoiceText}</strong></div>
                </div>
              ) : (
                <div className="space-y-2 text-sm text-slate-600">
                  {answer.textAnswer && <p className="whitespace-pre-wrap rounded-lg bg-slate-50 p-3">{answer.textAnswer}</p>}
                  {answer.fileName && (
                    <div className="rounded-lg bg-slate-50 p-3">
                      File demo: <strong>{answer.fileName}</strong> ({Math.round((answer.fileSize || 0) / 1024)} KB)
                    </div>
                  )}
                </div>
              )}
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
}
