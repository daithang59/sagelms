import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  Bot,
  CheckCircle2,
  ClipboardList,
  GraduationCap,
  Loader2,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  UserCog,
  Users,
} from 'lucide-react';

import { Badge, Card, CardBody, CardHeader } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import type { Course, CourseListResponse, CourseStatus, Enrollment, EnrollmentStatus } from '@/types/course';
import type { User, UserListResponse, UserRole } from '@/types/auth';

interface AdminDashboardData {
  users: User[];
  totalUsers: number;
  pendingInstructors: User[];
  totalPendingInstructors: number;
  courses: Course[];
}

interface InstructorDashboardData {
  courses: Course[];
  enrollments: Enrollment[];
}

interface StudentDashboardData {
  enrollments: Enrollment[];
  recommendedCourses: Course[];
}

interface DashboardState {
  loading: boolean;
  error: string;
  admin?: AdminDashboardData;
  instructor?: InstructorDashboardData;
  student?: StudentDashboardData;
}

interface StatCardProps {
  label: string;
  value: string | number;
  hint: string;
  icon: typeof BookOpen;
  tone: 'violet' | 'cyan' | 'emerald' | 'amber';
}

const toneClasses: Record<StatCardProps['tone'], string> = {
  violet: 'bg-violet-50 text-violet-700 border-violet-100',
  cyan: 'bg-cyan-50 text-cyan-700 border-cyan-100',
  emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  amber: 'bg-amber-50 text-amber-700 border-amber-100',
};

const courseStatusLabel: Record<CourseStatus, string> = {
  DRAFT: 'Bản nháp',
  PUBLISHED: 'Đã xuất bản',
  ARCHIVED: 'Đã lưu trữ',
};

const enrollmentStatusLabel: Record<EnrollmentStatus, string> = {
  PENDING: 'Chờ duyệt',
  ACTIVE: 'Đang học',
  COMPLETED: 'Hoàn thành',
  DROPPED: 'Đã dừng',
  REJECTED: 'Bị từ chối',
};

function formatDate(value?: string | null) {
  if (!value) {
    return 'Chưa có';
  }

  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(value));
}

function getCourseBadgeVariant(status: CourseStatus) {
  if (status === 'PUBLISHED') {
    return 'success';
  }
  if (status === 'DRAFT') {
    return 'warning';
  }
  return 'neutral';
}

function getEnrollmentBadgeVariant(status: EnrollmentStatus) {
  if (status === 'PENDING') {
    return 'warning';
  }
  if (status === 'ACTIVE') {
    return 'info';
  }
  if (status === 'COMPLETED') {
    return 'success';
  }
  if (status === 'REJECTED') {
    return 'error';
  }
  return 'neutral';
}

function roleLabel(role?: UserRole) {
  if (role === 'ADMIN') {
    return 'Quản trị viên';
  }
  if (role === 'INSTRUCTOR') {
    return 'Giảng viên';
  }
  return 'Học viên';
}

function StatCard({ label, value, hint, icon: Icon, tone }: StatCardProps) {
  return (
    <Card hover>
      <CardBody className="flex items-center gap-4">
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border ${toneClasses[tone]}`}>
          <Icon className="h-6 w-6" />
        </div>
        <div className="min-w-0">
          <p className="text-2xl font-bold text-slate-900">{value}</p>
          <p className="text-sm font-medium text-slate-700">{label}</p>
          <p className="mt-1 truncate text-xs text-slate-500">{hint}</p>
        </div>
      </CardBody>
    </Card>
  );
}

function SectionHeader({
  title,
  description,
  icon: Icon,
  to,
}: {
  title: string;
  description: string;
  icon: typeof BookOpen;
  to?: string;
}) {
  return (
    <CardHeader>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
            <p className="text-sm text-slate-500">{description}</p>
          </div>
        </div>
        {to && (
          <Link
            to={to}
            className="inline-flex items-center gap-2 text-sm font-semibold text-violet-700 hover:text-violet-800"
          >
            Xem tất cả
            <ArrowRight className="h-4 w-4" />
          </Link>
        )}
      </div>
    </CardHeader>
  );
}

function EmptyState({ icon: Icon, title, description }: { icon: typeof BookOpen; title: string; description: string }) {
  return (
    <div className="flex min-h-48 flex-col items-center justify-center px-6 py-10 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
        <Icon className="h-7 w-7" />
      </div>
      <p className="font-semibold text-slate-800">{title}</p>
      <p className="mt-1 max-w-sm text-sm text-slate-500">{description}</p>
    </div>
  );
}

function CourseRow({ course, showInstructor = false }: { course: Course; showInstructor?: boolean }) {
  return (
    <Link
      to={`/courses/${course.id}`}
      className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-4 transition-colors last:border-b-0 hover:bg-slate-50"
    >
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="line-clamp-1 font-semibold text-slate-900">{course.title}</h3>
          <Badge variant={getCourseBadgeVariant(course.status)}>{courseStatusLabel[course.status]}</Badge>
        </div>
        <p className="mt-1 line-clamp-2 text-sm text-slate-500">{course.description}</p>
        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-500">
          {course.category && <span>{course.category}</span>}
          {showInstructor && <span>Giảng viên: {course.instructorFullName || course.instructorEmail || 'Chưa cập nhật'}</span>}
          <span>{course.enrollmentCount} học viên</span>
        </div>
      </div>
      <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-slate-400" />
    </Link>
  );
}

function EnrollmentRow({ enrollment, index = 0 }: { enrollment: Enrollment; index?: number }) {
  return (
    <Link
      to={`/courses/${enrollment.courseId}`}
      className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-4 opacity-0 transition-colors last:border-b-0 hover:bg-slate-50 animate-fade-up"
      style={{ animationDelay: `${Math.min(index * 40, 400)}ms` }}
    >
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="line-clamp-1 font-semibold text-slate-900">
            {enrollment.courseTitle || `Khóa học ${enrollment.courseId.slice(0, 8)}`}
          </h3>
          <Badge variant={getEnrollmentBadgeVariant(enrollment.status)}>
            {enrollmentStatusLabel[enrollment.status]}
          </Badge>
        </div>
        <p className="mt-2 text-sm text-slate-500">Đăng ký ngày {formatDate(enrollment.enrolledAt)}</p>
      </div>
      <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-slate-400" />
    </Link>
  );
}

function UserRow({ user }: { user: User }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-4 last:border-b-0">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="line-clamp-1 font-semibold text-slate-900">{user.fullName}</h3>
          <Badge variant={user.instructorApprovalStatus === 'PENDING' ? 'warning' : 'neutral'}>
            {user.instructorApprovalStatus === 'PENDING' ? 'Chờ duyệt' : roleLabel(user.role)}
          </Badge>
        </div>
        <p className="mt-1 text-sm text-slate-500">{user.email}</p>
        {user.instructorExpertise && (
          <p className="mt-2 line-clamp-1 text-xs text-slate-500">Chuyên môn: {user.instructorExpertise}</p>
        )}
      </div>
      <span className="shrink-0 text-xs text-slate-400">{formatDate(user.createdAt)}</span>
    </div>
  );
}

function QuickAction({
  to,
  icon: Icon,
  title,
  description,
}: {
  to: string;
  icon: typeof BookOpen;
  title: string;
  description: string;
}) {
  return (
    <Link
      to={to}
      className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 transition-colors hover:border-violet-200 hover:bg-violet-50/40"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-700">
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="font-semibold text-slate-900">{title}</p>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>
    </Link>
  );
}

function AdminDashboard({ data }: { data: AdminDashboardData }) {
  const publishedCourses = data.courses.filter((course) => course.status === 'PUBLISHED').length;
  const draftCourses = data.courses.filter((course) => course.status === 'DRAFT');
  const archivedCourses = data.courses.filter((course) => course.status === 'ARCHIVED');
  const publishedWithoutLearners = data.courses.filter(
    (course) => course.status === 'PUBLISHED' && course.enrollmentCount === 0,
  );
  const activeUsers = data.users.filter((user) => user.isActive !== false).length;
  const recentCourses = data.courses.slice(0, 5);
  const operationItems = [
    {
      label: 'Hồ sơ giảng viên chờ duyệt',
      value: data.totalPendingInstructors,
      tone: 'warning' as const,
      visible: data.totalPendingInstructors > 0,
    },
    {
      label: 'Khóa bản nháp cần theo dõi',
      value: draftCourses.length,
      tone: 'info' as const,
      visible: draftCourses.length > 0,
    },
    {
      label: 'Khóa đã lưu trữ',
      value: archivedCourses.length,
      tone: 'neutral' as const,
      visible: archivedCourses.length > 0,
    },
    {
      label: 'Khóa đã xuất bản nhưng chưa có học viên',
      value: publishedWithoutLearners.length,
      tone: 'warning' as const,
      visible: publishedWithoutLearners.length > 0,
    },
  ].filter((item) => item.visible);

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Tổng user" value={data.totalUsers} hint={`${activeUsers} tài khoản đang hoạt động`} icon={Users} tone="violet" />
        <StatCard label="Chờ duyệt" value={data.totalPendingInstructors} hint="Hồ sơ giảng viên cần xử lý" icon={ShieldCheck} tone="amber" />
        <StatCard label="Khóa đã xuất bản" value={publishedCourses} hint={`${data.courses.length} khóa trong hệ thống`} icon={BookOpen} tone="emerald" />
        <StatCard label="Tác vụ admin" value="3" hint="User, giáo viên, khóa học" icon={UserCog} tone="cyan" />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <SectionHeader
            title="Hồ sơ giáo viên chờ duyệt"
            description="Ưu tiên kiểm tra hồ sơ mới để giáo viên có thể đăng nhập."
            icon={ShieldCheck}
            to="/admin/instructors"
          />
          {data.pendingInstructors.length > 0 ? (
            data.pendingInstructors.map((pendingUser) => <UserRow key={pendingUser.id} user={pendingUser} />)
          ) : (
            <EmptyState icon={CheckCircle2} title="Không có hồ sơ đang chờ" description="Hiện tại chưa có giảng viên mới cần duyệt." />
          )}
        </Card>

        <div className="space-y-4">
          <QuickAction to="/admin/courses" icon={BookOpen} title="Quản trị khóa học" description="Giám sát, lưu trữ hoặc khôi phục khóa trong hệ thống." />
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                  <AlertCircle className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">Việc cần xử lý</h3>
                  <p className="text-sm text-slate-500">Tín hiệu vận hành dành riêng cho admin.</p>
                </div>
              </div>
            </CardHeader>
            <CardBody className="space-y-3">
              {operationItems.length > 0 ? (
                operationItems.map((item) => (
                  <div key={item.label} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                    <span className="text-sm text-slate-600">{item.label}</span>
                    <Badge variant={item.tone}>{item.value}</Badge>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">Chưa có cảnh báo vận hành cần xử lý.</p>
              )}
            </CardBody>
          </Card>
          <QuickAction to="/admin/users" icon={UserCog} title="Quản lý user" description="Tìm kiếm, chỉnh sửa, khóa hoặc mở tài khoản." />
          <QuickAction to="/admin/instructors" icon={ShieldCheck} title="Duyệt giảng viên" description="Duyệt hoặc từ chối hồ sơ đăng ký giảng viên." />
        </div>
      </div>

      <Card>
        <SectionHeader
          title="Khóa học gần đây"
          description="Các khóa mới hoặc vừa cập nhật trong hệ thống."
          icon={BookOpen}
          to="/admin/courses"
        />
        {recentCourses.length > 0 ? (
          recentCourses.map((course) => <CourseRow key={course.id} course={course} showInstructor />)
        ) : (
          <EmptyState icon={BookOpen} title="Chưa có khóa học" description="Khi giáo viên tạo khóa học, danh sách sẽ xuất hiện tại đây." />
        )}
      </Card>
    </>
  );
}

function InstructorDashboard({ data }: { data: InstructorDashboardData }) {
  const publishedCourses = data.courses.filter((course) => course.status === 'PUBLISHED');
  const draftCourses = data.courses.filter((course) => course.status === 'DRAFT');
  const activeEnrollments = data.enrollments.filter((enrollment) => enrollment.status === 'ACTIVE');
  const totalStudents = data.courses.reduce((sum, course) => sum + course.enrollmentCount, 0);
  const latestCourses = data.courses.slice(0, 5);

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Khóa của tôi" value={data.courses.length} hint="Chỉ tính khóa do bạn tạo" icon={BookOpen} tone="violet" />
        <StatCard label="Đã xuất bản" value={publishedCourses.length} hint="Học viên có thể đăng ký" icon={CheckCircle2} tone="emerald" />
        <StatCard label="Bản nháp" value={draftCourses.length} hint="Cần hoàn thiện trước khi mở học" icon={ClipboardList} tone="amber" />
        <StatCard label="Người học" value={totalStudents} hint="Tổng lượt đăng ký trong khóa của bạn" icon={Users} tone="cyan" />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <SectionHeader
            title="Khóa học của bạn"
            description="Tập trung quản lý khóa do chính bạn tạo."
            icon={BookOpen}
            to="/courses"
          />
          {latestCourses.length > 0 ? (
            latestCourses.map((course) => <CourseRow key={course.id} course={course} />)
          ) : (
            <EmptyState icon={BookOpen} title="Bạn chưa có khóa học" description="Tạo khóa đầu tiên để bắt đầu xây dựng nội dung giảng dạy." />
          )}
        </Card>

        <Card>
          <SectionHeader title="Việc nên làm" description="Các bước giúp khóa học sẵn sàng hơn." icon={TrendingUp} />
          <div className="space-y-3 px-6 py-4">
            {draftCourses.length > 0 ? (
              draftCourses.slice(0, 3).map((course) => (
                <Link
                  key={course.id}
                  to={`/courses/${course.id}`}
                  className="block rounded-xl border border-amber-200 bg-amber-50 p-3 hover:bg-amber-100"
                >
                  <p className="line-clamp-1 text-sm font-semibold text-amber-900">{course.title}</p>
                  <p className="mt-1 text-xs text-amber-700">Hoàn thiện nội dung rồi xuất bản khóa học.</p>
                </Link>
              ))
            ) : (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
                Các khóa hiện tại không còn bản nháp cần xử lý.
              </div>
            )}
            <QuickAction to="/courses" icon={BookOpen} title="Mở trang khóa học" description="Tạo, sửa bài học và xem học viên trong từng khóa." />
          </div>
        </Card>
      </div>

      <Card>
        <SectionHeader
          title="Khóa tôi đang học"
          description="Các khóa của giảng viên khác mà bạn đã đăng ký học."
          icon={GraduationCap}
          to="/courses"
        />
        {activeEnrollments.length > 0 ? (
          activeEnrollments.slice(0, 5).map((enrollment, index) => <EnrollmentRow key={enrollment.id} enrollment={enrollment} index={index} />)
        ) : (
          <EmptyState icon={GraduationCap} title="Chưa đăng ký học khóa nào" description="Mở tab Khám phá khóa học để học thêm từ giảng viên khác." />
        )}
      </Card>
    </>
  );
}

function StudentDashboard({ data }: { data: StudentDashboardData }) {
  const activeEnrollments = data.enrollments.filter((enrollment) => enrollment.status === 'ACTIVE');
  const completedEnrollments = data.enrollments.filter((enrollment) => enrollment.status === 'COMPLETED');
  const enrolledCourseIds = useMemo(
    () => new Set(data.enrollments.map((enrollment) => enrollment.courseId)),
    [data.enrollments],
  );
  const recommendedCourses = data.recommendedCourses
    .filter((course) => !enrolledCourseIds.has(course.id))
    .slice(0, 5);

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Đã đăng ký" value={data.enrollments.length} hint="Tổng khóa học của bạn" icon={GraduationCap} tone="violet" />
        <StatCard label="Đang học" value={activeEnrollments.length} hint="Khóa cần tiếp tục" icon={BookOpen} tone="cyan" />
        <StatCard label="Hoàn thành" value={completedEnrollments.length} hint="Khóa đã kết thúc" icon={CheckCircle2} tone="emerald" />
        <StatCard label="Gợi ý" value={recommendedCourses.length} hint="Khóa phù hợp để khám phá" icon={Bot} tone="amber" />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card>
          <SectionHeader
            title="Tiếp tục học"
            description="Các khóa học đang hoạt động của bạn."
            icon={BookOpen}
            to="/courses"
          />
          {activeEnrollments.length > 0 ? (
            activeEnrollments.slice(0, 5).map((enrollment, index) => <EnrollmentRow key={enrollment.id} enrollment={enrollment} index={index} />)
          ) : (
            <EmptyState icon={GraduationCap} title="Chưa có khóa đang học" description="Đăng ký một khóa học để bắt đầu theo dõi tiến độ." />
          )}
        </Card>

        <Card>
          <SectionHeader
            title="Khóa học gợi ý"
            description="Một số khóa đã xuất bản mà bạn có thể đăng ký."
            icon={Bot}
            to="/courses"
          />
          {recommendedCourses.length > 0 ? (
            recommendedCourses.map((course) => <CourseRow key={course.id} course={course} showInstructor />)
          ) : (
            <EmptyState icon={BookOpen} title="Chưa có gợi ý mới" description="Bạn đã đăng ký các khóa hiện có hoặc chưa có khóa được xuất bản." />
          )}
        </Card>
      </div>
    </>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [state, setState] = useState<DashboardState>({
    loading: true,
    error: '',
  });

  useEffect(() => {
    let cancelled = false;

    void Promise.resolve().then(async () => {
      if (!user) {
        if (!cancelled) {
          setState({ loading: false, error: '' });
        }
        return;
      }

      if (!cancelled) {
        setState((current) => ({ ...current, loading: true, error: '' }));
      }

      try {
        if (user.role === 'ADMIN') {
          const [usersResponse, pendingResponse, coursesResponse] = await Promise.all([
            api.get<UserListResponse>('/users?page=1&size=100'),
            api.get<UserListResponse>('/users/instructor-applications?status=PENDING&page=1&size=5'),
            api.get<CourseListResponse>('/courses?size=100'),
          ]);

          if (!cancelled) {
            setState({
              loading: false,
              error: '',
              admin: {
                users: usersResponse.data,
                totalUsers: usersResponse.meta.totalElements,
                pendingInstructors: pendingResponse.data,
                totalPendingInstructors: pendingResponse.meta.totalElements,
                courses: coursesResponse.content,
              },
            });
          }
          return;
        }

        if (user.role === 'INSTRUCTOR') {
          const [coursesResponse, enrollmentsResponse] = await Promise.all([
            api.get<CourseListResponse>('/courses?size=100'),
            api.get<Enrollment[]>('/courses/enrolled'),
          ]);

          if (!cancelled) {
            setState({
              loading: false,
              error: '',
              instructor: {
                courses: coursesResponse.content,
                enrollments: enrollmentsResponse,
              },
            });
          }
          return;
        }

        const [enrollmentsResponse, coursesResponse] = await Promise.all([
          api.get<Enrollment[]>('/courses/enrolled'),
          api.get<CourseListResponse>('/courses?size=8'),
        ]);

        if (!cancelled) {
          setState({
            loading: false,
            error: '',
            student: {
              enrollments: enrollmentsResponse,
              recommendedCourses: coursesResponse.content,
            },
          });
        }
      } catch (error) {
        if (!cancelled) {
          setState({
            loading: false,
            error: error instanceof Error ? error.message : 'Không tải được dữ liệu dashboard.',
          });
        }
      }
    });

    return () => {
      cancelled = true;
    };
  }, [user]);

  return (
    <div className="space-y-6 animate-in">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-600 via-indigo-600 to-sky-500 p-8 text-white shadow-xl shadow-indigo-500/20">
        {/* Abstract background shapes */}
        <div className="absolute -right-20 -top-20 h-72 w-72 animate-blob rounded-full bg-white/20 blur-3xl mix-blend-overlay" />
        <div className="absolute -bottom-32 -left-10 h-72 w-72 animate-blob rounded-full bg-cyan-400/30 blur-3xl mix-blend-overlay" style={{ animationDelay: '2s' }} />
        <div className="absolute left-1/3 top-10 h-48 w-48 animate-blob rounded-full bg-fuchsia-400/30 blur-3xl mix-blend-overlay" style={{ animationDelay: '4s' }} />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />

        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-3xl rounded-3xl bg-white/10 p-6 backdrop-blur-md ring-1 ring-white/20 shadow-2xl sm:p-8">
            <div className="mb-4 flex items-center gap-2 animate-float" style={{ animationDelay: '0ms' }}>
              <span className="inline-flex items-center justify-center rounded-lg bg-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white backdrop-blur-md ring-1 ring-white/30 shadow-sm">
                {roleLabel(user?.role)}
              </span>
            </div>
            <h1 className="flex items-center gap-3 text-3xl font-extrabold text-white sm:text-4xl animate-float" style={{ animationDelay: '200ms' }}>
              Xin chào, {user?.fullName || 'bạn'}! <Sparkles className="h-8 w-8 text-yellow-300 drop-shadow-md" />
            </h1>
            <p className="mt-3 text-base text-indigo-50 sm:text-lg animate-float" style={{ animationDelay: '400ms' }}>
              {user?.role === 'ADMIN' && 'Theo dõi người dùng, hồ sơ giảng viên và chất lượng nội dung trong hệ thống.'}
              {user?.role === 'INSTRUCTOR' && 'Quản lý khóa học của bạn, theo dõi học viên và hoàn thiện nội dung giảng dạy.'}
              {user?.role === 'STUDENT' && 'Tiếp tục các khóa đang học và tìm thêm nội dung phù hợp với bạn.'}
            </p>
          </div>
          <Link
            to="/courses"
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-6 py-4 text-sm font-bold text-indigo-600 shadow-xl shadow-black/10 transition-all hover:-translate-y-1 hover:bg-slate-50 hover:shadow-2xl active:translate-y-0 animate-float"
            style={{ animationDelay: '600ms' }}
          >
            Mở khóa học
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </div>

      {state.loading && (
        <Card>
          <CardBody className="flex items-center justify-center gap-3 py-14 text-slate-500">
            <Loader2 className="h-5 w-5 animate-spin" />
            Đang tải dashboard...
          </CardBody>
        </Card>
      )}

      {!state.loading && state.error && (
        <Card>
          <CardBody className="flex items-start gap-3 py-8 text-rose-700">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p className="font-semibold">Không tải được dữ liệu dashboard</p>
              <p className="mt-1 text-sm text-rose-600">{state.error}</p>
            </div>
          </CardBody>
        </Card>
      )}

      {!state.loading && !state.error && user?.role === 'ADMIN' && state.admin && <AdminDashboard data={state.admin} />}
      {!state.loading && !state.error && user?.role === 'INSTRUCTOR' && state.instructor && <InstructorDashboard data={state.instructor} />}
      {!state.loading && !state.error && user?.role === 'STUDENT' && state.student && <StudentDashboard data={state.student} />}
    </div>
  );
}
