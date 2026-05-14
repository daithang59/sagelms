import { useNavigate } from 'react-router-dom';
import { Badge, Card, CardBody } from '@/components/ui';
import type { ChallengeSubmissionSummary } from '@/types/challenge';
import { FileText } from 'lucide-react';

interface ChallengeSubmitPageProps {
  challengeId: string;
  submissions: ChallengeSubmissionSummary[];
  participantNames: Record<string, string>;
}

function gradingBadge(status: string) {
  if (status === 'GRADED') return <Badge variant="success">Đã chấm</Badge>;
  if (status === 'PENDING_REVIEW') return <Badge variant="warning">Chờ chấm</Badge>;
  return <Badge variant="neutral">Đang làm</Badge>;
}

function formatSubmittedAt(submittedAt: string | null) {
  if (!submittedAt) return 'Chưa nộp';
  return new Date(submittedAt).toLocaleString('vi-VN');
}

export default function ChallengeSubmitPage({ challengeId, submissions, participantNames }: ChallengeSubmitPageProps) {
  const navigate = useNavigate();

  return (
    <Card>
      <CardBody className="space-y-4">
        <div className="border-b border-slate-100 pb-4">
          <h2 className="text-lg font-bold text-slate-800">
            Danh sách nộp bài <span className="ml-2 text-sm font-normal text-slate-500">({submissions.length} bài nộp)</span>
          </h2>
        </div>
        {submissions.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="mx-auto mb-4 h-12 w-12 text-slate-300" />
            <p className="text-slate-500">Chưa có bài nộp nào.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {submissions.map((submission) => (
              <button
                key={submission.attemptId}
                type="button"
                onClick={() => navigate(`/challenges/${challengeId}/submissions/${submission.attemptId}/review`)}
                className="flex w-full items-center justify-between gap-4 rounded-xl border border-slate-100 p-4 text-left transition hover:border-violet-200 hover:bg-violet-50"
              >
                <div className="grid min-w-0 flex-1 grid-cols-[minmax(180px,0.8fr)_auto_minmax(260px,1.2fr)] items-start gap-x-6">
                  <div className="min-w-0">
                    <div className="truncate font-medium text-slate-800">
                      {participantNames[submission.participantId] || submission.participantEmail || submission.participantId}
                    </div>
                    {submission.participantEmail && (
                      <div className="mt-1 truncate text-xs text-slate-500">{submission.participantEmail}</div>
                    )}
                  </div>
                  <div className="h-full w-px bg-slate-200" />
                  <div className="min-w-0">
                    <div className="truncate font-medium text-slate-800">{submission.questionSetTitle}</div>
                    <div className="mt-1 truncate text-xs text-slate-500">Nộp lúc: {formatSubmittedAt(submission.submittedAt)}</div>
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-center gap-2">
                  {submission.gradingStatus === 'GRADED' && submission.score !== null ? (
                    <div className="text-base font-bold text-slate-900">
                      {Number(submission.score).toFixed(2)}
                      <span className="ml-1 text-xs font-semibold text-slate-400">/10</span>
                    </div>
                  ) : (
                    <div className="text-sm font-semibold text-slate-400">--</div>
                  )}
                  {gradingBadge(submission.gradingStatus)}
                </div>
              </button>
            ))}
          </div>
        )}
      </CardBody>
    </Card>
  );
}
