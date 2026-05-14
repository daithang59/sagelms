import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Badge, Button, Card, CardBody } from '@/components/ui';
import { useToast } from '@/components/Toast';
import { useAuth } from '@/contexts/AuthContext';
import { useChallengeAttempt, useChallenges, useUserProfiles } from '@/hooks';
import type { Challenge, ChallengeLeaderboardEntry, ChallengeQuestionSet, ChallengeSubmissionSummary } from '@/types/challenge';
import { ArrowLeft, BookOpen, Plus, Trophy, Users } from 'lucide-react';
import ChallengeForm from './ChallengeForm';
import ChallengeQuestionPage from './ChallengeQuestionPage';
import ChallengeRankingPage from './ChallengeRankingPage';
import ChallengeResultListPage from './ChallengeResultListPage';
import ChallengeSubmitPage from './ChallengeSubmitPage';

type ChallengeDetailTab = 'questions' | 'submissions' | 'results' | 'ranking';

function statusBadge(status: string) {
  const variants: Record<string, 'success' | 'warning' | 'neutral'> = {
    PUBLISHED: 'success',
    DRAFT: 'warning',
    ARCHIVED: 'neutral',
  };
  const labels: Record<string, string> = {
    PUBLISHED: 'Đã xuất bản',
    DRAFT: 'Bản nháp',
    ARCHIVED: 'Lưu trữ',
  };
  return <Badge variant={variants[status] || 'neutral'}>{labels[status] || status}</Badge>;
}

function visibleQuestionSets(questionSets: ChallengeQuestionSet[]) {
  return questionSets.filter((questionSet) => !(
    questionSet.questionCount === 0
    && questionSet.title.trim().toLowerCase() === 'tap cau hoi mac dinh'
  ));
}

function getTabFromSearch(searchParams: URLSearchParams): ChallengeDetailTab {
  const tab = searchParams.get('tab');
  return tab === 'submissions' || tab === 'results' || tab === 'ranking' ? tab : 'questions';
}

export default function ChallengeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const { showToast } = useToast();
  const { fetchChallenge, loading } = useChallenges();
  const {
    startQuestionSetAttempt,
    fetchSubmissions,
    fetchMyGradedSubmissions,
    fetchLeaderboard,
    loading: attemptLoading,
  } = useChallengeAttempt();
  const { fetchPublicUserProfiles } = useUserProfiles();
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [questionSets, setQuestionSets] = useState<ChallengeQuestionSet[]>([]);
  const [submissions, setSubmissions] = useState<ChallengeSubmissionSummary[]>([]);
  const [myGradedSubmissions, setMyGradedSubmissions] = useState<ChallengeSubmissionSummary[]>([]);
  const [leaderboard, setLeaderboard] = useState<ChallengeLeaderboardEntry[]>([]);
  const [participantNames, setParticipantNames] = useState<Record<string, string>>({});
  const [showChallengeForm, setShowChallengeForm] = useState(false);

  const userId = user?.id;
  const userRole = user?.role;
  const canManage = userRole === 'ADMIN' || challenge?.instructorId === userId;
  const activeTab = getTabFromSearch(searchParams);
  const currentTab = (
    (activeTab === 'submissions' && !canManage)
    || (activeTab === 'results' && canManage)
  ) ? 'questions' : activeTab;

  const latestSubmissionByParticipantAndSet = useMemo(() => {
    const grouped = new Map<string, ChallengeSubmissionSummary>();
    submissions.forEach((submission) => {
      const key = `${submission.participantId}:${submission.questionSetId}`;
      const existing = grouped.get(key);
      if (!existing || (submission.submittedAt || '') > (existing.submittedAt || '')) {
        grouped.set(key, submission);
      }
    });
    return Array.from(grouped.values());
  }, [submissions]);

  const participantCount = useMemo(() => {
    return new Set(submissions.map((submission) => submission.participantId)).size;
  }, [submissions]);

  const participantIdKey = useMemo(() => {
    const ids = [
      ...submissions.map((submission) => submission.participantId),
      ...leaderboard.map((entry) => entry.participantId),
    ];
    return Array.from(new Set(ids)).sort().join(',');
  }, [leaderboard, submissions]);

  useEffect(() => {
    if (!id) return;
    let ignore = false;

    fetchChallenge(id)
      .then(async (response) => {
        if (ignore) return;

        setChallenge(response.challenge);
        setQuestionSets(visibleQuestionSets(response.questionSets || []));

        const ranking = await fetchLeaderboard(id);
        if (!ignore) {
          setLeaderboard(ranking);
        }

        if (userId && (userRole === 'ADMIN' || response.challenge.instructorId === userId)) {
          const data = await fetchSubmissions(id);
          if (!ignore) {
            setSubmissions(data);
          }
        }

        if (userId) {
          const data = await fetchMyGradedSubmissions(id);
          if (!ignore) {
            setMyGradedSubmissions(data);
          }
        }
      })
      .catch((error) => {
        if (!ignore) {
          showToast(error instanceof Error ? error.message : 'Không tải được thử thách', 'error');
        }
      });

    return () => {
      ignore = true;
    };
  }, [id, fetchChallenge, fetchLeaderboard, fetchMyGradedSubmissions, fetchSubmissions, showToast, userId, userRole]);

  useEffect(() => {
    if (!participantIdKey) {
      return;
    }

    let ignore = false;
    fetchPublicUserProfiles(participantIdKey.split(','))
      .then((profiles) => {
        if (ignore) return;
        setParticipantNames(Object.fromEntries(
          profiles.map((profile) => [profile.id, profile.fullName || profile.email]),
        ));
      })
      .catch(() => {
        if (!ignore) {
          setParticipantNames({});
        }
      });

    return () => {
      ignore = true;
    };
  }, [fetchPublicUserProfiles, participantIdKey]);

  useEffect(() => {
    if (!id || !userId || currentTab !== 'results') {
      return;
    }

    let ignore = false;
    fetchMyGradedSubmissions(id)
      .then((data) => {
        if (!ignore) {
          setMyGradedSubmissions(data);
        }
      })
      .catch((error) => {
        if (!ignore) {
          showToast(error instanceof Error ? error.message : 'Không tải được kết quả bài làm', 'error');
        }
      });

    return () => {
      ignore = true;
    };
  }, [currentTab, fetchMyGradedSubmissions, id, showToast, userId]);

  const handleStartSet = async (questionSet: ChallengeQuestionSet) => {
    try {
      const attempt = await startQuestionSetAttempt(questionSet.id);
      navigate(`/challenges/${challenge?.id}/take?attemptId=${attempt.id}&questionSetId=${questionSet.id}&startedAt=${encodeURIComponent(attempt.startedAt)}`);
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Không thể bắt đầu tập câu hỏi', 'error');
    }
  };

  const refreshChallenge = async () => {
    if (!id) return;
    const response = await fetchChallenge(id);
    setChallenge(response.challenge);
    setQuestionSets(visibleQuestionSets(response.questionSets || []));
  };

  if (loading || !challenge) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-500 border-t-transparent" />
      </div>
    );
  }

  const gradients = [
    'from-violet-500 via-purple-500 to-indigo-500',
    'from-cyan-500 via-blue-500 to-teal-500',
    'from-rose-500 via-pink-500 to-rose-400',
  ];
  const gradientIndex = challenge.title.charCodeAt(0) % gradients.length;

  return (
    <div className="space-y-8">
      <button onClick={() => navigate('/challenges')} className="flex items-center gap-2 text-slate-600 transition-colors hover:text-slate-900">
        <ArrowLeft className="h-5 w-5" />
        Quay lại danh sách thử thách
      </button>

      <div className={`relative h-64 overflow-hidden rounded-2xl bg-gradient-to-br ${gradients[gradientIndex]}`}>
        {challenge.thumbnailUrl ? (
          <img src={challenge.thumbnailUrl} alt={challenge.title} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Trophy className="h-24 w-24 text-white/70" />
          </div>
        )}
        <div className="absolute inset-0 bg-black/30" />
        <div className="absolute bottom-6 left-6 right-6">
          <div className="mb-3 flex items-center gap-3">
            {statusBadge(challenge.status)}
            {challenge.category && <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white">{challenge.category}</span>}
          </div>
          <h1 className="text-3xl font-bold text-white">{challenge.title}</h1>
        </div>
      </div>

      <Card>
        <CardBody>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant={currentTab === 'questions' ? 'primary' : 'secondary'} onClick={() => setSearchParams({})}>
              Câu hỏi
            </Button>
            {canManage && (
              <Button type="button" variant={currentTab === 'submissions' ? 'primary' : 'secondary'} onClick={() => setSearchParams({ tab: 'submissions' })}>
                Nộp bài
              </Button>
            )}
            {!canManage && (
              <Button type="button" variant={currentTab === 'results' ? 'primary' : 'secondary'} onClick={() => setSearchParams({ tab: 'results' })}>
                Kết quả
              </Button>
            )}
            <Button type="button" variant={currentTab === 'ranking' ? 'primary' : 'secondary'} onClick={() => setSearchParams({ tab: 'ranking' })}>
              Xếp hạng
            </Button>
          </div>
        </CardBody>
      </Card>

      {currentTab === 'questions' ? (
        <div className={canManage ? 'grid grid-cols-1 gap-8 lg:grid-cols-3' : 'space-y-6'}>
          <div className={canManage ? 'space-y-6 lg:col-span-2' : 'space-y-6'}>
            <Card>
              <CardBody>
                <h2 className="mb-2 text-lg font-bold text-slate-800">Mô tả thử thách</h2>
                <p className="leading-relaxed text-slate-600">{challenge.description || 'Thử thách chưa có mô tả.'}</p>
              </CardBody>
            </Card>
            <ChallengeQuestionPage
              challenge={challenge}
              questionSets={questionSets}
              canManage={canManage}
              attemptLoading={attemptLoading}
              onStartQuestionSet={handleStartSet}
            />
          </div>
          {canManage && (
            <div className="space-y-6">
              <Card>
                <CardBody className="space-y-4">
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Users className="h-4 w-4" />
                    <span>{participantCount} người tham gia</span>
                  </div>

                  <div className="flex items-center gap-2 text-violet-600">
                    <BookOpen className="h-5 w-5" />
                    <span className="font-medium">
                      {challenge.instructorId === userId ? 'Bạn là giảng viên của thử thách này' : 'Bạn có quyền quản lý thử thách này'}
                    </span>
                  </div>

                  <Button className="w-full" onClick={() => setShowChallengeForm(true)}>
                    <Plus className="h-4 w-4" />
                    Chỉnh sửa thử thách
                  </Button>
                </CardBody>
              </Card>
            </div>
          )}
        </div>
      ) : currentTab === 'submissions' && canManage ? (
        <ChallengeSubmitPage challengeId={challenge.id} submissions={latestSubmissionByParticipantAndSet} participantNames={participantNames} />
      ) : currentTab === 'results' && !canManage ? (
        <ChallengeResultListPage challengeId={challenge.id} submissions={myGradedSubmissions} />
      ) : currentTab === 'ranking' ? (
        <ChallengeRankingPage leaderboard={leaderboard} participantNames={participantNames} />
      ) : null}

      <ChallengeForm
        isOpen={showChallengeForm}
        onClose={() => setShowChallengeForm(false)}
        onSuccess={refreshChallenge}
        editChallenge={challenge}
      />
    </div>
  );
}
