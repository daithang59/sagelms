import { useEffect, useRef, useState, type CSSProperties, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge, Button, Card, CardBody, useConfirm } from '@/components/ui';
import { useToast } from '@/components/Toast';
import { useAuth } from '@/contexts/AuthContext';
import { useChallenges, useUserProfiles } from '@/hooks';
import type { Challenge } from '@/types/challenge';
import {
  ArrowRight,
  Clock,
  Edit,
  Filter,
  Plus,
  Search,
  Swords,
  Trash2,
  Trophy,
  UserRound,
  Users,
} from 'lucide-react';
import ChallengeForm from './ChallengeForm';

type InstructorChallengeTab = 'mine' | 'explore';

const staggerStyle = (index: number) => ({
  '--stagger-delay': `${Math.min(index * 40, 400)}ms`,
}) as CSSProperties;

const categoryOptions = [
  'Programming',
  'Web Development',
  'Database',
  'Data Science',
  'AI',
  'Mobile Development',
  'DevOps',
  'Cybersecurity',
  'Design',
  'Education',
  'Product',
  'Business',
  'Marketing',
];

const gradients = [
  'from-violet-500 via-purple-500 to-indigo-500',
  'from-cyan-500 via-blue-500 to-teal-500',
  'from-rose-500 via-pink-500 to-rose-400',
  'from-amber-500 via-orange-500 to-yellow-500',
  'from-emerald-500 via-teal-500 to-cyan-500',
  'from-slate-600 via-slate-500 to-slate-400',
];

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

function ChallengeCard({
  challenge,
  canManage,
  creatorName,
  onEdit,
  onDelete,
}: {
  challenge: Challenge;
  canManage: boolean;
  creatorName: string;
  onEdit: (challenge: Challenge) => void;
  onDelete: (challenge: Challenge) => void;
}) {
  const navigate = useNavigate();
  const gradient = gradients[challenge.title.charCodeAt(0) % gradients.length];

  return (
    <div className="interactive-surface group relative overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition-all duration-300 hover:shadow-xl">
      <div className={`relative flex h-40 items-center justify-center overflow-hidden bg-gradient-to-br ${gradient}`}>
        {challenge.thumbnailUrl ? (
          <img src={challenge.thumbnailUrl} alt={challenge.title} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
            <Trophy className="h-8 w-8 text-white" />
          </div>
        )}
        <div className="absolute right-3 top-3 z-20">{statusBadge(challenge.status)}</div>
        {challenge.category && (
          <div className="absolute bottom-3 left-3 z-20">
            <span className="rounded-full border border-white/20 bg-white/20 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-md">
              {challenge.category}
            </span>
          </div>
        )}
        {canManage && (
          <div className="absolute left-3 top-3 z-20 flex gap-2">
            <button onClick={() => onEdit(challenge)} className="pressable rounded-lg bg-white/20 p-2 backdrop-blur-md transition-colors hover:bg-white/30">
              <Edit className="h-4 w-4 text-white" />
            </button>
            <button onClick={() => onDelete(challenge)} className="pressable rounded-lg bg-white/20 p-2 backdrop-blur-md transition-colors hover:bg-red-500/80">
              <Trash2 className="h-4 w-4 text-white" />
            </button>
          </div>
        )}
      </div>

      <CardBody className="space-y-4 p-5">
        <h3 className="min-h-[3.5rem] text-lg font-bold leading-tight text-slate-800 line-clamp-2">
          {challenge.title}
        </h3>
        <p className="min-h-[2.5rem] text-sm text-slate-500 line-clamp-2">
          {challenge.description || 'Thử thách chưa có mô tả.'}
        </p>
        <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-600">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-violet-600">
            <UserRound className="h-4 w-4" />
          </div>
          <span className="min-w-0 truncate">
            Tạo bởi <span className="font-semibold text-slate-800">{creatorName}</span>
          </span>
        </div>
        <div className="flex items-center justify-between border-t border-slate-100 pt-2">
          <div className="flex items-center gap-4 text-sm text-slate-400">
            <div className="flex items-center gap-1.5">
              <Swords className="h-4 w-4" />
              <span className="font-medium">{challenge.questionCount}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              <span>{challenge.timeLimitMinutes ? `${challenge.timeLimitMinutes} phút` : 'Tự do'}</span>
            </div>
          </div>
        </div>
        <Button variant="outline" className="w-full justify-center" onClick={() => navigate(`/challenges/${challenge.id}`)}>
          {canManage ? 'Quản lý' : 'Xem thử thách'}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardBody>
    </div>
  );
}

export default function ChallengesPage() {
  const { challenges, loading, error, fetchChallenges, deleteChallenge } = useChallenges();
  const { fetchPublicUserProfiles } = useUserProfiles();
  const { user } = useAuth();
  const { showToast } = useToast();
  const confirm = useConfirm();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingChallenge, setEditingChallenge] = useState<Challenge | null>(null);
  const [creatorNames, setCreatorNames] = useState<Record<string, string>>({});
  const [instructorTab, setInstructorTab] = useState<InstructorChallengeTab>('mine');
  const hasFetched = useRef(false);
  const canCreateChallenge = user?.role === 'INSTRUCTOR' || user?.role === 'ADMIN';
  const isInstructor = user?.role === 'INSTRUCTOR';
  const tabAnimationKey = isInstructor ? instructorTab : 'all-challenges';
  const displayedChallenges = !isInstructor || !user?.id
    ? challenges
    : instructorTab === 'mine'
      ? challenges.filter((challenge) => challenge.instructorId === user.id)
      : challenges.filter((challenge) => (
        challenge.status === 'PUBLISHED' && challenge.instructorId !== user.id
      ));

  useEffect(() => {
    if (!hasFetched.current) {
      hasFetched.current = true;
      fetchChallenges().catch(() => {
        hasFetched.current = false;
      });
    }
  }, [fetchChallenges]);

  useEffect(() => {
    const instructorIds = challenges.map((challenge) => challenge.instructorId).filter(Boolean);
    if (instructorIds.length === 0) {
      return;
    }

    let ignore = false;
    fetchPublicUserProfiles(instructorIds)
      .then((profiles) => {
        if (ignore) return;
        setCreatorNames(Object.fromEntries(
          profiles.map((profile) => [profile.id, profile.fullName || profile.email]),
        ));
      })
      .catch(() => {
        if (!ignore) {
          setCreatorNames({});
        }
      });

    return () => {
      ignore = true;
    };
  }, [challenges, fetchPublicUserProfiles]);

  const handleSearch = (event: FormEvent) => {
    event.preventDefault();
    fetchChallenges({ search: searchQuery, category: selectedCategory });
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    fetchChallenges({ search: searchQuery, category });
  };

  const handleDelete = async (challenge: Challenge) => {
    if (user?.role !== 'ADMIN' && challenge.instructorId !== user?.id) {
      showToast('Bạn không có quyền xóa thử thách này.', 'warning');
      return;
    }
    const confirmed = await confirm({
      title: 'Xóa thử thách',
      message: `Bạn có chắc chắn muốn xóa thử thách "${challenge.title}"?`,
      confirmLabel: 'Xóa thử thách',
      cancelLabel: 'Hủy',
      variant: 'danger',
    });
    if (!confirmed) return;
    try {
      await deleteChallenge(challenge.id);
      showToast('Xóa thử thách thành công!', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Xóa thử thách thất bại', 'error');
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Thử thách</h1>
          <p className="mt-1 text-slate-500">
            {canCreateChallenge ? 'Tạo và quản lý các thử thách mở cho học viên.' : 'Tham gia các thử thách đang mở.'}
          </p>
        </div>
        {canCreateChallenge && (
          <Button
            className="gap-2 shadow-lg shadow-violet-500/25"
            onClick={() => {
              setEditingChallenge(null);
              setIsFormOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />
            Tạo thử thách
          </Button>
        )}
      </div>

      {isInstructor && (
        <div className="inline-flex rounded-xl bg-white p-1 shadow-sm ring-1 ring-slate-200">
          <button
            type="button"
            onClick={() => setInstructorTab('mine')}
            className={`pressable rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-200 ${
              instructorTab === 'mine'
                ? 'bg-violet-50 text-violet-700 ring-1 ring-violet-200'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            Quản lý thử thách
          </button>
          <button
            type="button"
            onClick={() => setInstructorTab('explore')}
            className={`pressable rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-200 ${
              instructorTab === 'explore'
                ? 'bg-violet-50 text-violet-700 ring-1 ring-violet-200'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            Khám phá thử thách
          </button>
        </div>
      )}

      <Card className="border-slate-200 shadow-sm">
        <CardBody className="p-2">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Tìm kiếm thử thách..."
                className="w-full rounded-xl border border-surface-200 bg-surface-50 py-3 pl-12 pr-4 text-surface-900 outline-none transition-all duration-200 placeholder:text-surface-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10"
              />
            </div>
            <Button type="submit" variant="secondary" className="h-12 gap-2 border-slate-200 px-6 hover:border-violet-300 hover:bg-violet-50">
              <Filter className="h-4 w-4" />
              <span className="hidden sm:inline">Tìm kiếm</span>
            </Button>
          </form>
          <div className="mt-2 flex gap-2 overflow-x-auto px-1 pb-1">
            <button
              type="button"
              onClick={() => handleCategoryChange('')}
              className={`pressable shrink-0 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                selectedCategory === ''
                  ? 'bg-violet-600 text-white'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              Tất cả lĩnh vực
            </button>
            {categoryOptions.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => handleCategoryChange(category)}
                className={`pressable shrink-0 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  selectedCategory === category
                    ? 'bg-violet-600 text-white'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </CardBody>
      </Card>

      {error && <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-red-600">{error}</div>}

      {loading && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((item, index) => (
            <div
              key={item}
              className="stagger-enter h-80 skeleton rounded-2xl bg-white ring-1 ring-slate-100"
              style={staggerStyle(index)}
            />
          ))}
        </div>
      )}

      {!loading && displayedChallenges.length > 0 && (
        <div key={`challenges-${tabAnimationKey}`} className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {displayedChallenges.map((challenge, index) => (
            <div
              key={`${tabAnimationKey}-${challenge.id}`}
              className="stagger-enter"
              style={staggerStyle(index)}
            >
              <ChallengeCard
                challenge={challenge}
                canManage={user?.role === 'ADMIN' || challenge.instructorId === user?.id}
                creatorName={creatorNames[challenge.instructorId] || 'Giảng viên'}
                onEdit={(item) => {
                  setEditingChallenge(item);
                  setIsFormOpen(true);
                }}
                onDelete={handleDelete}
              />
            </div>
          ))}
        </div>
      )}

      {!loading && displayedChallenges.length === 0 && (
        <Card className="border-slate-200 py-10">
          <CardBody className="text-center">
            <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-cyan-100 to-blue-100">
              <Users className="h-12 w-12 text-cyan-600" />
            </div>
            <h3 className="mb-2 text-xl font-bold text-slate-700">Chưa có thử thách nào</h3>
            <p className="mx-auto mb-8 max-w-md text-slate-500">
              {isInstructor && instructorTab === 'mine'
                ? 'Hãy tạo thử thách đầu tiên để học viên và giảng viên khác có thể tham gia.'
                : isInstructor && instructorTab === 'explore'
                  ? 'Chưa có thử thách published nào từ giảng viên khác để bạn tham gia.'
                  : canCreateChallenge
                    ? 'Hãy tạo thử thách đầu tiên để học viên có thể tham gia.'
                    : 'Hiện chưa có thử thách nào đang mở.'}
            </p>
            {canCreateChallenge && (!isInstructor || instructorTab === 'mine') && (
              <Button className="gap-2 shadow-lg shadow-violet-500/25" onClick={() => setIsFormOpen(true)}>
                <Plus className="h-4 w-4" />
                Tạo thử thách đầu tiên
              </Button>
            )}
          </CardBody>
        </Card>
      )}

      <ChallengeForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingChallenge(null);
        }}
        onSuccess={() => fetchChallenges({ search: searchQuery, category: selectedCategory })}
        editChallenge={editingChallenge}
      />
    </div>
  );
}
