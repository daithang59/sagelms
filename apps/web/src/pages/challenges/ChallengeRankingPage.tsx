import { Card, CardBody } from '@/components/ui';
import type { ChallengeLeaderboardEntry } from '@/types/challenge';
import { Trophy } from 'lucide-react';

interface ChallengeRankingPageProps {
  leaderboard: ChallengeLeaderboardEntry[];
  participantNames: Record<string, string>;
}

function formatSeconds(seconds: number) {
  return `${Math.max(0, Math.round(seconds || 0))} giây`;
}

function formatPercent(value: number) {
  const normalized = Number(value || 0);
  return `${normalized.toFixed(Number.isInteger(normalized) ? 0 : 2)}%`;
}

export default function ChallengeRankingPage({ leaderboard, participantNames }: ChallengeRankingPageProps) {
  return (
    <Card>
      <CardBody className="space-y-4">
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <h2 className="text-lg font-bold text-slate-800">
            Bảng xếp hạng <span className="ml-2 text-sm font-normal text-slate-500">({leaderboard.length} học viên)</span>
          </h2>
          <Trophy className="h-5 w-5 text-amber-400" />
        </div>

        {leaderboard.length === 0 ? (
          <div className="p-12 text-center">
            <Trophy className="mx-auto mb-4 h-12 w-12 text-slate-300" />
            <p className="text-slate-500">Chưa có học viên nào được chấm điểm để xếp hạng.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-left text-sm">
              <thead>
                <tr className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="whitespace-nowrap px-3 py-3">STT</th>
                  <th className="min-w-52 px-3 py-3">Tên học viên</th>
                  <th className="whitespace-nowrap px-3 py-3">Tập hoàn thành</th>
                  <th className="min-w-56 px-3 py-3">Thời gian</th>
                  <th className="whitespace-nowrap px-3 py-3">% chính xác</th>
                  <th className="whitespace-nowrap px-3 py-3 text-right">Điểm</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {leaderboard.map((entry) => {
                  const maxScore = entry.totalQuestionSets * 10;
                  return (
                    <tr key={entry.participantId} className="transition hover:bg-violet-50/40">
                      <td className="whitespace-nowrap px-3 py-4 font-bold text-slate-800">#{entry.rank}</td>
                      <td className="px-3 py-4">
                        <div className="font-semibold text-slate-900">{participantNames[entry.participantId] || entry.participantEmail || entry.participantId}</div>
                        <div className="mt-1 text-xs text-slate-400">
                          Bắt đầu: {new Date(entry.firstStartedAt).toLocaleString('vi-VN')}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-slate-700">
                        {entry.completedQuestionSets}/{entry.totalQuestionSets}
                      </td>
                      <td className="px-3 py-4 text-slate-700">
                        {formatSeconds(entry.totalUsedSeconds)} / {entry.totalLimitSeconds > 0 ? formatSeconds(entry.totalLimitSeconds) : 'Không giới hạn'}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 font-semibold text-slate-700">{formatPercent(entry.accuracyPercent)}</td>
                      <td className="whitespace-nowrap px-3 py-4 text-right">
                        <span className="font-bold text-violet-600">{Number(entry.rankingScore).toFixed(2)}</span>
                        <span className="ml-1 text-xs font-semibold text-slate-400">/{maxScore}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardBody>
    </Card>
  );
}
