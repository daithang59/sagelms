import { useEffect, useRef, useState, type CSSProperties, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge, Button, Card, CardBody, useConfirm } from '@/components/ui';
import { useToast } from '@/components/Toast';
import { useAuth } from '@/contexts/AuthContext';
import { useChallenges, useUserProfiles } from '@/hooks';
import type { Challenge } from '@/types/challenge';
import {
  Edit,
  Filter,
  Plus,
  Search,
  Trash2,
  Trophy,
  UserRound,
  Users,
  X,
} from 'lucide-react';
import ChallengeForm from './ChallengeForm';
import { AnimatePresence, motion } from 'framer-motion';

function InstructorProfileModal({
  name,
  onClose,
}: {
  name: string | null;
  onClose: () => void;
}) {
  if (!name) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
      />
      <motion.div
        className="relative w-full max-w-sm rounded-2xl bg-white shadow-xl"
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
      >
        <div className="flex items-start justify-between p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-100 text-lg font-bold text-violet-700">
              {name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">{name}</h2>
              <p className="mt-1 text-sm text-slate-500">Giảng viên SageLMS</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </motion.div>
    </div>
  );
}

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
  onInstructorClick,
}: {
  challenge: Challenge;
  canManage: boolean;
  creatorName: string;
  onEdit: (challenge: Challenge) => void;
  onDelete: (challenge: Challenge) => void;
  onInstructorClick: (name: string) => void;
}) {
  const navigate = useNavigate();
  const gradient = gradients[challenge.title.charCodeAt(0) % gradients.length];

  return (
    <div className="group relative overflow-hidden rounded-[1.5rem] border border-slate-100 bg-white shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.08)] hover:border-slate-200">
      <div className={`relative flex h-48 items-center justify-center overflow-hidden bg-gradient-to-br ${gradient}`}>
        {challenge.thumbnailUrl ? (
          <img src={challenge.thumbnailUrl} alt={challenge.title} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
        ) : (
          <div className="flex h-20 w-20 items-center justify-center rounded-[1.5rem] bg-white/20 backdrop-blur-md shadow-inner transition-transform duration-700 group-hover:scale-110 group-hover:-rotate-3">
            <Trophy className="h-10 w-10 text-white drop-shadow-md" />
          </div>
        )}
        
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
        
        <div className="absolute right-4 top-4 z-20 transition-transform duration-500 group-hover:-translate-y-1">
          {statusBadge(challenge.status)}
        </div>
        
        {canManage && (
          <div className="absolute left-4 top-4 z-20 flex gap-2 opacity-0 transition-all duration-500 -translate-y-2 group-hover:opacity-100 group-hover:translate-y-0">
            <button onClick={(e) => { e.stopPropagation(); onEdit(challenge); }} className="pressable rounded-xl bg-white/90 p-2.5 text-slate-700 shadow-sm backdrop-blur-md transition-colors hover:text-violet-600 hover:bg-white">
              <Edit className="h-4 w-4" />
            </button>
            <button onClick={(e) => { e.stopPropagation(); onDelete(challenge); }} className="pressable rounded-xl bg-white/90 p-2.5 text-slate-700 shadow-sm backdrop-blur-md transition-colors hover:text-rose-600 hover:bg-white">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      <div className="relative p-6 bg-white flex flex-col min-h-[220px]">
        {challenge.category && (
          <div className="absolute -top-4 left-6 z-30 transition-transform duration-500 group-hover:-translate-y-1">
            <span className="rounded-full bg-slate-800 px-4 py-1.5 text-xs font-bold text-white shadow-lg shadow-black/10 ring-1 ring-white/10">
              {challenge.category}
            </span>
          </div>
        )}
        
        <h3 className="mt-2 text-xl font-bold leading-tight text-slate-900 line-clamp-2 transition-colors duration-300 group-hover:text-violet-700">
          {challenge.title}
        </h3>

        <p className="mt-2 text-sm leading-6 text-slate-500 line-clamp-2">
          {challenge.description || 'Thử thách chưa có mô tả.'}
        </p>

        <div className="grid grid-rows-[0fr] opacity-0 transition-all duration-500 ease-out group-hover:grid-rows-[1fr] group-hover:opacity-100 group-hover:mt-4">
           <div className="overflow-hidden space-y-4">
              <div className="flex items-center justify-between text-sm text-slate-500 border-b border-slate-100 pb-3">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onInstructorClick(creatorName);
                  }}
                  className="flex items-center gap-2 group/author cursor-pointer"
                >
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-slate-600 group-hover/author:bg-violet-100 group-hover/author:text-violet-600 transition-colors">
                    <UserRound className="h-3 w-3" />
                  </div>
                  <span className="truncate group-hover/author:text-violet-600 transition-colors">{creatorName}</span>
                </button>
             </div>
             <Button className="w-full shadow-sm shadow-violet-500/20 hover:shadow-violet-500/40" onClick={() => navigate(`/challenges/${challenge.id}`)}>
               {canManage ? 'Quản lý' : 'Xem chi tiết'}
             </Button>
           </div>
        </div>
      </div>
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
  const [selectedInstructorName, setSelectedInstructorName] = useState<string | null>(null);
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
            className="gap-2 shadow-sm"
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
        <div className="inline-flex rounded-xl bg-slate-100 p-1 shadow-inner">
          <button
            type="button"
            onClick={() => setInstructorTab('mine')}
            className={`pressable rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-200 ${
              instructorTab === 'mine'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            Quản lý thử thách
          </button>
          <button
            type="button"
            onClick={() => setInstructorTab('explore')}
            className={`pressable rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-200 ${
              instructorTab === 'explore'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            Khám phá thử thách
          </button>
        </div>
      )}

      <Card className="border-slate-200 shadow-sm">
        <CardBody className="p-4">
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
          <div className="filter-scrollbar -mx-4 mt-4 flex gap-2.5 overflow-x-auto px-4 pb-3 pt-1">
            <button
              type="button"
              onClick={() => handleCategoryChange('')}
              className={`pressable shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                selectedCategory === ''
                  ? 'bg-slate-800 text-white shadow-sm ring-1 ring-slate-800'
                  : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              Tất cả lĩnh vực
            </button>
            {categoryOptions.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => handleCategoryChange(category)}
                className={`pressable shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                  selectedCategory === category
                    ? 'bg-slate-800 text-white shadow-sm ring-1 ring-slate-800'
                    : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50 hover:text-slate-900'
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
                onInstructorClick={setSelectedInstructorName}
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
              <Button className="gap-2 shadow-sm" onClick={() => setIsFormOpen(true)}>
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

      <AnimatePresence>
        {selectedInstructorName && (
          <InstructorProfileModal
            name={selectedInstructorName}
            onClose={() => setSelectedInstructorName(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
