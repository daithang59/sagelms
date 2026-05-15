import { useNavigate } from 'react-router-dom';
import { Badge, Button, Card, CardBody } from '@/components/ui';
import type { Challenge, ChallengeQuestionSet } from '@/types/challenge';
import { CheckCircle2, Edit, Eye, FileText, PlayCircle, Plus, Swords } from 'lucide-react';

interface ChallengeQuestionPageProps {
  challenge: Challenge;
  questionSets: ChallengeQuestionSet[];
  canManage: boolean;
  attemptLoading: boolean;
  onStartQuestionSet: (questionSet: ChallengeQuestionSet) => void;
}

export default function ChallengeQuestionPage({
  challenge,
  questionSets,
  canManage,
  attemptLoading,
  onStartQuestionSet,
}: ChallengeQuestionPageProps) {
  const navigate = useNavigate();

  return (
    <Card>
      <CardBody className="space-y-4">
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <h2 className="text-lg font-bold text-slate-800">
            Tập câu hỏi <span className="ml-2 text-sm font-normal text-slate-500">({questionSets.length} tập)</span>
          </h2>
          {canManage && (
            <Button size="sm" onClick={() => navigate(`/challenges/${challenge.id}/question-sets/new`)}>
              <Plus className="h-4 w-4" />
              Thêm tập câu hỏi
            </Button>
          )}
        </div>

        {questionSets.length > 0 ? (
          <div className="space-y-3">
            {questionSets.map((questionSet, index) => (
              <div
                key={questionSet.id}
                className="flex flex-col gap-4 rounded-xl border border-slate-100 p-4 text-left transition hover:border-violet-200 hover:bg-violet-50/30 md:flex-row md:items-center"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-100 text-violet-600">
                  <FileText className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-slate-900">Tập {index + 1}: {questionSet.title}</h3>
                    {questionSet.completed && (
                      <Badge variant="success">
                        <CheckCircle2 className="mr-1 h-3 w-3" />
                        Đã hoàn thành
                      </Badge>
                    )}
                  </div>
                  <div className="mt-1 flex flex-wrap gap-3 text-sm text-slate-500">
                    <span>{questionSet.questionCount} câu hỏi</span>
                    <span>{questionSet.timeLimitMinutes ? `${questionSet.timeLimitMinutes} phút` : 'Không giới hạn'}</span>
                    {questionSet.attemptCount > 0 && <span>{questionSet.attemptCount} lần nộp</span>}
                  </div>
                </div>
                {canManage ? (
                  <Button
                    variant="secondary"
                    onClick={(event) => {
                      event.stopPropagation();
                      navigate(`/challenges/${challenge.id}/question-sets/${questionSet.id}`);
                    }}
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Quản lý
                  </Button>
                ) : (
                  questionSet.attemptCount < Math.max(1, challenge.maxAttempts || 1) ? (
                    <Button
                      onClick={() => onStartQuestionSet(questionSet)}
                      isLoading={attemptLoading}
                    >
                      <PlayCircle className="mr-2 h-4 w-4" />
                      {questionSet.completed
                        ? `Làm lại (${questionSet.attemptCount}/${Math.max(1, challenge.maxAttempts || 1)})`
                        : 'Làm bài'}
                    </Button>
                  ) : (
                    <Button
                      variant="secondary"
                      onClick={() => {
                        if (questionSet.latestSubmittedAttemptId) {
                          navigate(`/challenges/${challenge.id}/result/${questionSet.latestSubmittedAttemptId}`);
                        }
                      }}
                      disabled={!questionSet.latestSubmittedAttemptId}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      Đã nộp bài
                    </Button>
                  )
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center">
            <Swords className="mx-auto mb-4 h-12 w-12 text-slate-300" />
            <p className="text-slate-500">Chưa có tập câu hỏi nào</p>
          </div>
        )}
      </CardBody>
    </Card>
  );
}
