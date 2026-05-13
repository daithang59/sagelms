import type { CSSProperties, FormEvent, ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge, Button, Card, CardBody, CardHeader } from '@/components/ui';
import { useToast } from '@/components/Toast';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import type { SelfProfileUpdateRequest } from '@/types/auth';
import type { Course, CourseListResponse, Enrollment, EnrollmentStatus } from '@/types/course';
import {
  BookOpen,
  BriefcaseBusiness,
  CalendarDays,
  Camera,
  CheckCircle2,
  Clock3,
  ExternalLink,
  GraduationCap,
  Save,
  ShieldCheck,
  Sparkles,
  UserRound,
} from 'lucide-react';

const inputClass =
  'w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100';

interface ProfileSummary {
  enrollments: Enrollment[];
  teachingCourses: Course[];
}

export default function ProfilePage() {
  const { user, updateProfile, refreshUser } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState<SelfProfileUpdateRequest>(() => (user ? toProfileForm(user) : {}));
  const [summary, setSummary] = useState<ProfileSummary>({ enrollments: [], teachingCourses: [] });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function loadProfile() {
      setLoading(true);
      try {
        const freshUser = await refreshUser().catch(() => null);
        if (mounted && freshUser) {
          setForm(toProfileForm(freshUser));
        }

        const [enrollments, teachingCourses] = await Promise.all([
          api.get<Enrollment[]>('/courses/enrolled').catch(() => []),
          user?.role === 'INSTRUCTOR'
            ? api.get<CourseListResponse>('/courses?scope=teaching&size=100').then((res) => res.content || []).catch(() => [])
            : Promise.resolve([]),
        ]);

        if (mounted) {
          setSummary({ enrollments, teachingCourses });
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }
    void loadProfile();
    return () => {
      mounted = false;
    };
  }, [refreshUser, user?.role]);

  const profileCompletion = useMemo(() => {
    const checks = [
      Boolean(form.fullName?.trim()),
      Boolean(form.email?.trim()),
      Boolean(form.avatarUrl?.trim()),
      user?.role !== 'INSTRUCTOR' || Boolean(form.instructorHeadline?.trim()),
      user?.role !== 'INSTRUCTOR' || Boolean(form.instructorBio?.trim()),
      user?.role !== 'INSTRUCTOR' || Boolean(form.instructorExpertise?.trim()),
    ];
    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  }, [form, user?.role]);

  const learningStats = useMemo(() => {
    const active = summary.enrollments.filter((item) => item.status === 'ACTIVE').length;
    const pending = summary.enrollments.filter((item) => item.status === 'PENDING').length;
    const completed = summary.enrollments.filter((item) => item.status === 'COMPLETED').length;
    return { active, pending, completed, total: summary.enrollments.length };
  }, [summary.enrollments]);

  const teachingStats = useMemo(() => {
    const published = summary.teachingCourses.filter((item) => item.status === 'PUBLISHED').length;
    const drafts = summary.teachingCourses.filter((item) => item.status === 'DRAFT').length;
    const learners = summary.teachingCourses.reduce((sum, item) => sum + (item.enrollmentCount || 0), 0);
    return { published, drafts, learners, total: summary.teachingCourses.length };
  }, [summary.teachingCourses]);

  const update = <K extends keyof SelfProfileUpdateRequest>(key: K, value: SelfProfileUpdateRequest[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!form.fullName?.trim() || !form.email?.trim()) {
      showToast('Vui lòng nhập họ tên và email.', 'warning');
      return;
    }

    setSaving(true);
    try {
      await updateProfile(form);
      showToast('Đã cập nhật hồ sơ cá nhân.', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Cập nhật hồ sơ thất bại.', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  const recentEnrollments = [...summary.enrollments]
    .sort((a, b) => new Date(b.enrolledAt).getTime() - new Date(a.enrolledAt).getTime())
    .slice(0, 4);

  return (
    <div className="mx-auto max-w-[1500px] space-y-6 animate-in">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Hồ sơ cá nhân</h1>
          <p className="mt-1 text-sm text-slate-500">
            Quản lý thông tin hiển thị, vai trò trong hệ thống và hoạt động học tập của bạn.
          </p>
        </div>
        <Badge variant={user.role === 'ADMIN' ? 'brand' : user.role === 'INSTRUCTOR' ? 'info' : 'neutral'}>
          {roleLabel(user.role)}
        </Badge>
      </div>

      <div className="grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
        <aside className="space-y-6">
          <Card>
            <CardBody className="text-center">
              {form.avatarUrl ? (
                <img src={form.avatarUrl} alt="" className="mx-auto h-28 w-28 rounded-3xl object-cover shadow-lg" />
              ) : (
                <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-3xl bg-gradient-brand text-4xl font-bold text-white shadow-lg">
                  {user.fullName?.charAt(0)?.toUpperCase() || 'U'}
                </div>
              )}
              <h2 className="mt-4 text-xl font-bold text-slate-900">{form.fullName || user.fullName}</h2>
              <p className="mt-1 text-sm text-slate-500">{form.email || user.email}</p>

              <div className="mt-5 rounded-2xl bg-slate-50 p-4 text-left">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-600">Mức hoàn thiện hồ sơ</span>
                  <span className="font-bold text-violet-700">{profileCompletion}%</span>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
                  <div className="h-full rounded-full bg-gradient-brand" style={{ width: `${profileCompletion}%` }} />
                </div>
              </div>

              <div className="mt-5 grid gap-3 text-left">
                <ProfileMeta icon={<UserRound className="h-4 w-4" />} label="Vai trò" value={roleLabel(user.role)} />
                <ProfileMeta icon={<CalendarDays className="h-4 w-4" />} label="Tham gia" value={formatDate(user.createdAt)} />
                <ProfileMeta icon={<Clock3 className="h-4 w-4" />} label="Đăng nhập gần nhất" value={formatDate(user.lastLoginAt)} />
                {user.role === 'INSTRUCTOR' && (
                  <ProfileMeta
                    icon={<ShieldCheck className="h-4 w-4" />}
                    label="Hồ sơ giảng viên"
                    value={instructorStatusLabel(user.instructorApprovalStatus)}
                  />
                )}
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-base font-bold text-slate-900">Tổng quan cá nhân</h2>
            </CardHeader>
            <CardBody className="space-y-3">
              <MiniStat icon={<BookOpen className="h-4 w-4" />} label="Khóa đang học" value={learningStats.active} />
              <MiniStat icon={<Clock3 className="h-4 w-4" />} label="Đang chờ duyệt" value={learningStats.pending} />
              <MiniStat icon={<CheckCircle2 className="h-4 w-4" />} label="Đã hoàn thành" value={learningStats.completed} />
              {user.role === 'INSTRUCTOR' && (
                <>
                  <MiniStat icon={<BriefcaseBusiness className="h-4 w-4" />} label="Khóa đang dạy" value={teachingStats.total} />
                  <MiniStat icon={<GraduationCap className="h-4 w-4" />} label="Học viên trong khóa" value={teachingStats.learners} />
                </>
              )}
            </CardBody>
          </Card>
        </aside>

        <main className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-1">
                <h2 className="text-lg font-bold text-slate-900">Thông tin hiển thị</h2>
                <p className="text-sm text-slate-500">Các thông tin này được dùng trên header, hồ sơ khóa học và trang quản trị.</p>
              </div>
            </CardHeader>
            <CardBody>
              {loading ? (
                <div className="py-10 text-center text-sm text-slate-500">Đang tải hồ sơ...</div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid gap-4 md:grid-cols-2">
                    <Field id="profile-full-name" label="Họ tên">
                      <input
                        id="profile-full-name"
                        value={form.fullName || ''}
                        onChange={(event) => update('fullName', event.target.value)}
                        className={inputClass}
                      />
                    </Field>
                    <Field id="profile-email" label="Email">
                      <input
                        id="profile-email"
                        type="email"
                        value={form.email || ''}
                        onChange={(event) => update('email', event.target.value)}
                        className={inputClass}
                      />
                    </Field>
                  </div>

                  <Field id="profile-avatar" label="Link ảnh đại diện">
                    <div className="relative">
                      <Camera className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        id="profile-avatar"
                        value={form.avatarUrl || ''}
                        onChange={(event) => update('avatarUrl', event.target.value)}
                        placeholder="Dán link ảnh đại diện, ví dụ https://..."
                        className={`${inputClass} pl-10`}
                      />
                    </div>
                  </Field>

                  {user.role === 'INSTRUCTOR' && (
                    <div className="space-y-4 rounded-2xl border border-slate-200 p-4">
                      <div>
                        <h3 className="font-semibold text-slate-900">Hồ sơ giảng viên</h3>
                        <p className="mt-1 text-sm text-slate-500">
                          Phần này giúp học viên hiểu bạn dạy gì, kinh nghiệm ra sao và vì sao nên học với bạn.
                        </p>
                      </div>
                      <Field id="profile-instructor-headline" label="Headline">
                        <input
                          id="profile-instructor-headline"
                          value={form.instructorHeadline || ''}
                          onChange={(event) => update('instructorHeadline', event.target.value)}
                          placeholder="Ví dụ: Senior Backend Engineer, Java & Microservices"
                          className={inputClass}
                        />
                      </Field>
                      <div className="grid gap-4 md:grid-cols-2">
                        <Field id="profile-instructor-expertise" label="Chuyên môn">
                          <input
                            id="profile-instructor-expertise"
                            value={form.instructorExpertise || ''}
                            onChange={(event) => update('instructorExpertise', event.target.value)}
                            placeholder="Java, Spring Boot, Cloud..."
                            className={inputClass}
                          />
                        </Field>
                        <Field id="profile-instructor-years" label="Số năm kinh nghiệm">
                          <input
                            id="profile-instructor-years"
                            type="number"
                            min={0}
                            value={form.instructorYearsExperience ?? 0}
                            onChange={(event) => update('instructorYearsExperience', Number(event.target.value))}
                            className={inputClass}
                          />
                        </Field>
                      </div>
                      <Field id="profile-instructor-website" label="Website / LinkedIn">
                        <input
                          id="profile-instructor-website"
                          value={form.instructorWebsite || ''}
                          onChange={(event) => update('instructorWebsite', event.target.value)}
                          placeholder="https://linkedin.com/in/..."
                          className={inputClass}
                        />
                      </Field>
                      <Field id="profile-instructor-bio" label="Giới thiệu giảng viên">
                        <textarea
                          id="profile-instructor-bio"
                          value={form.instructorBio || ''}
                          onChange={(event) => update('instructorBio', event.target.value)}
                          rows={5}
                          placeholder="Tóm tắt kinh nghiệm, phong cách dạy và nhóm học viên phù hợp."
                          className={inputClass}
                        />
                      </Field>
                    </div>
                  )}

                  <div className="flex justify-end">
                    <Button type="submit" isLoading={saving}>
                      <Save className="h-4 w-4" />
                      Lưu hồ sơ
                    </Button>
                  </div>
                </form>
              )}
            </CardBody>
          </Card>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)]">
            <Card>
              <CardHeader>
                <h2 className="text-lg font-bold text-slate-900">Hoạt động học tập gần đây</h2>
              </CardHeader>
              <CardBody className="space-y-3">
                {recentEnrollments.length === 0 ? (
                  <EmptyBlock
                    icon={<Sparkles className="h-6 w-6" />}
                    title="Chưa có hoạt động học tập"
                    description="Khám phá khóa học để bắt đầu xây dựng lộ trình học của bạn."
                    actionLabel="Khám phá khóa học"
                    onAction={() => navigate('/courses')}
                  />
                ) : (
                  recentEnrollments.map((enrollment, index) => (
                    <button
                      key={enrollment.id}
                      type="button"
                      onClick={() => navigate(`/courses/${enrollment.courseId}`)}
                      className="stagger-enter pressable flex w-full items-center justify-between gap-4 rounded-2xl border border-slate-200 p-4 text-left transition hover:border-violet-200 hover:bg-violet-50/40 hover:shadow-sm"
                      style={{ '--stagger-delay': `${Math.min(index * 45, 360)}ms` } as CSSProperties}
                    >
                      <span className="min-w-0">
                        <span className="block truncate font-semibold text-slate-900">{enrollment.courseTitle || 'Khóa học'}</span>
                        <span className="mt-1 block text-sm text-slate-500">Ghi danh ngày {formatDate(enrollment.enrolledAt)}</span>
                      </span>
                      <StatusBadge status={enrollment.status} />
                    </button>
                  ))
                )}
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <h2 className="text-lg font-bold text-slate-900">Lối tắt phù hợp</h2>
              </CardHeader>
              <CardBody className="space-y-3">
                <Shortcut
                  icon={<BookOpen className="h-5 w-5" />}
                  title="Khóa học của tôi"
                  description="Xem các khóa đã ghi danh, đang chờ duyệt hoặc đã hoàn thành."
                  onClick={() => navigate('/courses')}
                />
                {user.role === 'INSTRUCTOR' && (
                  <Shortcut
                    icon={<BriefcaseBusiness className="h-5 w-5" />}
                    title="Khóa tôi giảng dạy"
                    description={`${teachingStats.published} khóa đã xuất bản, ${teachingStats.drafts} bản nháp cần hoàn thiện.`}
                    onClick={() => navigate('/courses')}
                  />
                )}
                {user.role === 'ADMIN' && (
                  <Shortcut
                    icon={<ShieldCheck className="h-5 w-5" />}
                    title="Quản lý người dùng"
                    description="Xem, chỉnh sửa, khóa hoặc duyệt tài khoản trong hệ thống."
                    onClick={() => navigate('/admin/users')}
                  />
                )}
              </CardBody>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}

function ProfileMeta({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3">
      <span className="text-violet-600">{icon}</span>
      <span className="min-w-0">
        <span className="block text-xs font-semibold uppercase text-slate-400">{label}</span>
        <span className="block truncate text-sm font-medium text-slate-800">{value}</span>
      </span>
    </div>
  );
}

function MiniStat({ icon, label, value }: { icon: ReactNode; label: string; value: number }) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3">
      <div className="flex items-center gap-3 text-sm font-medium text-slate-700">
        <span className="text-violet-600">{icon}</span>
        {label}
      </div>
      <span className="text-lg font-bold text-slate-900">{value}</span>
    </div>
  );
}

function Field({ id, label, children }: { id: string; label: string; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
      </label>
      {children}
    </div>
  );
}

function EmptyBlock({
  icon,
  title,
  description,
  actionLabel,
  onAction,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <div className="surface-enter rounded-2xl border border-dashed border-slate-200 p-6 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-50 text-violet-600">{icon}</div>
      <h3 className="mt-3 font-semibold text-slate-900">{title}</h3>
      <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
      <Button type="button" variant="secondary" size="sm" className="mt-4" onClick={onAction}>
        {actionLabel}
      </Button>
    </div>
  );
}

function Shortcut({
  icon,
  title,
  description,
  onClick,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="pressable interactive-surface flex w-full items-center gap-4 rounded-2xl border border-slate-200 p-4 text-left transition hover:border-violet-200 hover:bg-violet-50/40"
    >
      <span className="flex h-11 w-11 flex-none items-center justify-center rounded-xl bg-violet-100 text-violet-700">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block font-semibold text-slate-900">{title}</span>
        <span className="mt-1 block text-sm leading-5 text-slate-500">{description}</span>
      </span>
      <ExternalLink className="h-4 w-4 flex-none text-slate-400" />
    </button>
  );
}

function StatusBadge({ status }: { status: EnrollmentStatus }) {
  const map: Record<EnrollmentStatus, { label: string; variant: 'success' | 'warning' | 'error' | 'neutral' }> = {
    ACTIVE: { label: 'Đang học', variant: 'success' },
    PENDING: { label: 'Chờ duyệt', variant: 'warning' },
    COMPLETED: { label: 'Hoàn thành', variant: 'success' },
    DROPPED: { label: 'Đã hủy', variant: 'neutral' },
    REJECTED: { label: 'Từ chối', variant: 'error' },
  };
  const item = map[status];
  return <Badge variant={item.variant}>{item.label}</Badge>;
}

function roleLabel(role: string) {
  if (role === 'ADMIN') return 'Quản trị viên';
  if (role === 'INSTRUCTOR') return 'Giảng viên';
  return 'Học viên';
}

function instructorStatusLabel(status?: string | null) {
  if (status === 'APPROVED') return 'Đã duyệt';
  if (status === 'REJECTED') return 'Từ chối';
  return 'Chờ duyệt';
}

function formatDate(value?: string | null) {
  if (!value) return 'Chưa có';
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium' }).format(new Date(value));
}

function toProfileForm(user: {
  email: string;
  fullName: string;
  avatarUrl?: string | null;
  instructorHeadline?: string | null;
  instructorBio?: string | null;
  instructorExpertise?: string | null;
  instructorWebsite?: string | null;
  instructorYearsExperience?: number | null;
}): SelfProfileUpdateRequest {
  return {
    email: user.email,
    fullName: user.fullName,
    avatarUrl: user.avatarUrl || '',
    instructorHeadline: user.instructorHeadline || '',
    instructorBio: user.instructorBio || '',
    instructorExpertise: user.instructorExpertise || '',
    instructorWebsite: user.instructorWebsite || '',
    instructorYearsExperience: user.instructorYearsExperience || 0,
  };
}
