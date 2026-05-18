import type { AssessmentSubmissionSummary } from '@/types/assessment';

interface AssessmentGradebookPageProps {
  submissions: AssessmentSubmissionSummary[];
  participantNames: Record<string, string>;
  className?: string;
}

export default function AssessmentGradebookPage({ submissions, participantNames, className = '' }: AssessmentGradebookPageProps) {
  if (submissions.length === 0) {
    return (
      <div className={`rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-500 ${className}`}>
        Chưa có bài làm nào được chấm.
      </div>
    );
  }

  return (
    <div className={`rounded-2xl border border-slate-200 bg-white p-6 shadow-sm ${className}`}>
      <h2 className="text-lg font-bold text-slate-900">Bảng điểm</h2>
      <div className="mt-5 overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-xs uppercase text-slate-500">
              <th className="py-3">Học viên</th>
              <th className="py-3">Bài kiểm tra</th>
              <th className="py-3">Tập câu hỏi</th>
              <th className="py-3">Trạng thái</th>
              <th className="py-3 text-right">Điểm</th>
            </tr>
          </thead>
          <tbody>
            {submissions.map((submission) => (
              <tr key={submission.attemptId} className="border-b border-slate-50">
                <td className="py-4 font-semibold text-slate-900">
                  {participantNames[submission.participantId] || submission.participantEmail || submission.participantId}
                </td>
                <td className="py-4 text-slate-600">{submission.assessmentTitle}</td>
                <td className="py-4 text-slate-600">{submission.questionSetTitle}</td>
                <td className="py-4 text-slate-600">
                  {submission.gradingStatus === 'GRADED' ? 'Đã chấm' : 'Chờ chấm'}
                </td>
                <td className="py-4 text-right font-bold text-violet-600">
                  {submission.score ?? '-'}{submission.maxScore ? `/${submission.maxScore}` : ''}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
