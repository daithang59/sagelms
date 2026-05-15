import { useCallback, useEffect, useState, useRef } from 'react';
import { Card, CardBody, Button, Badge, useConfirm } from '@/components/ui';
import { useCourses, useEnrollment } from '@/hooks';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/Toast';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Plus,
  Search,
  Filter,
  Users,
  GraduationCap,
  ArrowRight,
  Layers,
  Edit,
  Trash2,
  UserRound,
  Mail,
  ExternalLink,
  Award,
  X,
} from 'lucide-react';
import type { Course, Enrollment, EnrollmentStatus } from '@/types/course';
import CourseForm from './CourseForm';
import { AnimatePresence, motion } from 'framer-motion';

type CourseScope = 'teaching' | 'explore';
type StudentCourseTab = 'explore' | 'enrolled';

const staggerStyle = (index: number) => ({
  '--stagger-delay': `${Math.min(index * 40, 400)}ms`,
}) as React.CSSProperties;

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

function InstructorProfileModal({
  course,
  onClose,
}: {
  course: Course | null;
  onClose: () => void;
}) {
  if (!course) return null;

  const instructorName = course.instructorFullName || 'Giảng viên';

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
        className="relative w-full max-w-lg rounded-2xl bg-white shadow-xl"
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
      >
        <div className="flex items-start justify-between border-b border-slate-100 p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-100 text-lg font-bold text-violet-700">
              {instructorName.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">{instructorName}</h2>
              <p className="mt-1 text-sm text-slate-500">
                {course.instructorHeadline || 'Giảng viên SageLMS'}
              </p>
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

        <div className="space-y-5 p-6">
          <div className="flex flex-wrap gap-3 text-sm text-slate-600">
            {course.instructorEmail && (
              <span className="inline-flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2">
                <Mail className="h-4 w-4" />
                {course.instructorEmail}
              </span>
            )}
            {course.instructorYearsExperience !== null && (
              <span className="inline-flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2">
                <Award className="h-4 w-4" />
                {course.instructorYearsExperience} năm kinh nghiệm
              </span>
            )}
          </div>

          {course.instructorBio && (
            <p className="leading-relaxed text-slate-600">{course.instructorBio}</p>
          )}

          {course.instructorExpertise && (
            <div>
              <p className="text-sm font-semibold text-slate-700">Chuyên môn</p>
              <p className="mt-1 text-sm text-slate-600">{course.instructorExpertise}</p>
            </div>
          )}

          {course.instructorWebsite && (
            <a
              href={course.instructorWebsite}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 text-sm font-medium text-violet-600 hover:text-violet-700"
            >
              Xem website giảng viên
              <ExternalLink className="h-4 w-4" />
            </a>
          )}
        </div>
      </motion.div>
    </div>
  );
}

// ============================================================================
// Premium Course Card Component
// ============================================================================
interface CourseCardProps {
  course: Course;
  enrollmentStatus: EnrollmentStatus | null;
  onEnroll: () => void;
  getStatusBadge: (status: string) => React.ReactNode;
  canCreateCourse: boolean;
  currentUserId?: string;
  currentUserRole?: string;
  onEdit: (course: Course) => void;
  onDelete: (courseId: string, instructorId: string) => void;
  onInstructorClick: (course: Course) => void;
}

function CourseCard({
  course,
  enrollmentStatus,
  onEnroll,
  getStatusBadge,
  canCreateCourse,
  currentUserId,
  currentUserRole,
  onEdit,
  onDelete,
  onInstructorClick,
}: CourseCardProps) {
  const isOwner = canCreateCourse && course.instructorId === currentUserId;
  const canEnrollAsLearner = (currentUserRole === 'STUDENT' || currentUserRole === 'INSTRUCTOR') && !isOwner;
  const isEnrolled = enrollmentStatus === 'ACTIVE' || enrollmentStatus === 'COMPLETED';
  const isPending = enrollmentStatus === 'PENDING';
  const navigate = useNavigate();

  // Generate consistent gradient based on course title
  const gradients = [
    'from-violet-500 via-purple-500 to-indigo-500',
    'from-cyan-500 via-blue-500 to-teal-500',
    'from-rose-500 via-pink-500 to-rose-400',
    'from-amber-500 via-orange-500 to-yellow-500',
    'from-emerald-500 via-teal-500 to-cyan-500',
    'from-slate-600 via-slate-500 to-slate-400',
  ];
  const gradientIndex = course.title.charCodeAt(0) % gradients.length;

  return (
    <div className="group relative overflow-hidden rounded-[1.5rem] border border-slate-100 bg-white shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.08)] hover:border-slate-200">
      {/* Cover Area - Fixed height with consistent gradient */}
      <div className={`relative h-48 bg-gradient-to-br ${gradients[gradientIndex]} flex items-center justify-center overflow-hidden`}>
        {/* Decorative pattern */}
        <div className="absolute inset-0 opacity-[0.03]">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')]"></div>
        </div>

        {/* Thumbnail or Icon */}
        <div className="absolute inset-0">
          {course.thumbnailUrl ? (
            <img
              src={course.thumbnailUrl}
              alt={course.title}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="w-20 h-20 rounded-[1.5rem] bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner transition-transform duration-700 group-hover:scale-110 group-hover:-rotate-3">
                <BookOpen className="w-10 h-10 text-white drop-shadow-md" />
              </div>
            </div>
          )}
        </div>

        {/* Soft dark overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

        {/* Status Badge */}
        <div className="absolute top-4 right-4 z-20 transition-transform duration-500 group-hover:-translate-y-1">
          {getStatusBadge(course.status)}
        </div>

        {course.enrollmentPolicy === 'APPROVAL_REQUIRED' && (
          <div className="absolute bottom-4 right-4 z-20">
            <span className="rounded-full bg-amber-100 px-3 py-1.5 text-xs font-semibold text-amber-700 shadow-lg shadow-black/10">
              Cần duyệt
            </span>
          </div>
        )}

        {/* Owner Actions */}
        {(isOwner || currentUserRole === 'ADMIN') && (
          <div className="absolute top-4 left-4 z-20 flex gap-2 opacity-0 transition-all duration-500 -translate-y-2 group-hover:opacity-100 group-hover:translate-y-0">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(course);
              }}
              className="pressable rounded-xl bg-white/90 p-2.5 text-slate-700 shadow-sm backdrop-blur-md transition-colors hover:text-violet-600 hover:bg-white"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(course.id, course.instructorId);
              }}
              className="pressable rounded-xl bg-white/90 p-2.5 text-slate-700 shadow-sm backdrop-blur-md transition-colors hover:text-rose-600 hover:bg-white"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      <div className="relative p-6 bg-white flex flex-col min-h-[220px]">
        {/* Category Tag */}
        {course.category && (
          <div className="absolute -top-4 left-6 z-30 transition-transform duration-500 group-hover:-translate-y-1">
            <span className="rounded-full bg-slate-800 px-4 py-1.5 text-xs font-bold text-white shadow-lg shadow-black/10 ring-1 ring-white/10">
              {course.category}
            </span>
          </div>
        )}

        <h3 className="mt-2 text-xl font-bold leading-tight text-slate-900 mb-2 line-clamp-2 transition-colors duration-300 group-hover:text-violet-700">
          {course.title}
        </h3>

        <p className="text-sm leading-6 text-slate-500 line-clamp-2">
          {course.description || 'Khóa học chưa có mô tả.'}
        </p>

        {/* Hidden Content that reveals on hover */}
        <div className="grid grid-rows-[0fr] opacity-0 transition-all duration-500 ease-out group-hover:grid-rows-[1fr] group-hover:opacity-100 group-hover:mt-4">
           <div className="overflow-hidden space-y-4">
              <div className="flex items-center justify-between text-sm text-slate-500 border-b border-slate-100 pb-3">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onInstructorClick(course);
                  }}
                  className="flex items-center gap-2 group/author cursor-pointer"
                >
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-slate-600 group-hover/author:bg-violet-100 group-hover/author:text-violet-600 transition-colors">
                    <UserRound className="h-3 w-3" />
                  </div>
                  <span className="truncate max-w-[120px] group-hover/author:text-violet-600 transition-colors">{course.instructorFullName || 'Giảng viên SageLMS'}</span>
                </button>
                {course.enrollmentCount !== undefined && (
                  <span className="flex items-center gap-1 font-medium">
                    <Users className="h-3 w-3" />
                    {course.enrollmentCount}
                  </span>
                )}
             </div>
             
             {/* Action Buttons inside hover area */}
             <div>
                {isPending ? (
                  <Button
                    variant="secondary"
                    className="w-full justify-center"
                    onClick={() => navigate(`/courses/${course.id}`)}
                  >
                    <span className="truncate">Chờ giảng viên duyệt</span>
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                ) : isEnrolled ? (
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      className="flex-1 justify-center"
                      disabled
                    >
                      <GraduationCap className="w-4 h-4 mr-2" />
                      <span className="truncate">Đã ghi danh</span>
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 justify-center hover:bg-violet-600 hover:text-white"
                      onClick={() => navigate(`/courses/${course.id}`)}
                    >
                      <span className="truncate">Học ngay</span>
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                ) : isOwner || (currentUserId && currentUserRole === 'ADMIN') ? (
                  <Button
                    variant="outline"
                    className="w-full justify-center hover:bg-violet-600 hover:text-white"
                    onClick={() => navigate(`/courses/${course.id}`)}
                  >
                    <span className="truncate">Quản lý</span>
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                ) : canEnrollAsLearner ? (
                  <Button className="w-full justify-center shadow-sm shadow-violet-500/20 hover:shadow-violet-500/40" onClick={onEnroll}>
                    <Plus className="w-4 h-4 mr-2" />
                    {course.enrollmentPolicy === 'APPROVAL_REQUIRED' ? 'Gửi yêu cầu học' : 'Đăng ký học'}
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    className="w-full justify-center hover:bg-violet-600 hover:text-white"
                    onClick={() => navigate(`/courses/${course.id}`)}
                  >
                    <span className="truncate">Chi tiết</span>
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                )}
             </div>
           </div>
        </div>
      </div>
    </div>
  );
}

function getEnrollmentLabel(status: EnrollmentStatus) {
  if (status === 'PENDING') return 'Chờ duyệt';
  if (status === 'ACTIVE') return 'Đang học';
  if (status === 'COMPLETED') return 'Hoàn thành';
  if (status === 'DROPPED') return 'Đã hủy';
  if (status === 'REJECTED') return 'Bị từ chối';
  return status;
}

function getEnrollmentVariant(status: EnrollmentStatus): 'success' | 'warning' | 'error' | 'neutral' | 'info' {
  if (status === 'ACTIVE') return 'info';
  if (status === 'COMPLETED') return 'success';
  if (status === 'PENDING') return 'warning';
  if (status === 'REJECTED') return 'error';
  return 'neutral';
}

function EnrolledCourseCard({
  enrollment,
  onUnenroll,
}: {
  enrollment: Enrollment;
  onUnenroll: () => void;
}) {
  const navigate = useNavigate();
  const title = enrollment.courseTitle || `Khóa học ${enrollment.courseId.slice(0, 8)}`;
  const canLearn = enrollment.status === 'ACTIVE' || enrollment.status === 'COMPLETED';
  const isPending = enrollment.status === 'PENDING';

  return (
    <div className="interactive-surface rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition hover:shadow-lg">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-50 text-violet-600">
            <GraduationCap className="h-6 w-6" />
          </div>
          <h3 className="line-clamp-2 text-lg font-bold text-slate-800">{title}</h3>
          <p className="mt-2 text-sm text-slate-500">
            Đăng ký ngày {new Date(enrollment.enrolledAt).toLocaleDateString('vi-VN')}
          </p>
        </div>
        <Badge variant={getEnrollmentVariant(enrollment.status)}>
          {getEnrollmentLabel(enrollment.status)}
        </Badge>
      </div>

      {enrollment.reviewNote && (
        <p className="mt-4 rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-600">
          Ghi chú: {enrollment.reviewNote}
        </p>
      )}

      <div className="mt-5 flex gap-2">
        {canLearn ? (
          <Button className="flex-1 justify-center" onClick={() => navigate(`/courses/${enrollment.courseId}`)}>
            Học ngay
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button variant="secondary" className="flex-1 justify-center" onClick={() => navigate(`/courses/${enrollment.courseId}`)}>
            {isPending ? 'Xem trạng thái' : 'Xem khóa học'}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        )}
        {enrollment.status !== 'COMPLETED' && (
          <Button variant="outline" className="justify-center" onClick={onUnenroll}>
            Hủy
          </Button>
        )}
      </div>
    </div>
  );
}

function ConfirmUnenrollModal({
  courseTitle,
  onCancel,
  onConfirm,
}: {
  courseTitle: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onCancel}
      />
      <motion.div
        className="relative w-full max-w-md rounded-2xl bg-white shadow-xl"
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
      >
        <div className="border-b border-slate-100 p-5">
          <h2 className="text-lg font-bold text-slate-900">Hủy đăng ký khóa học?</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-500">
            Bạn có chắc chắn muốn hủy đăng ký khóa học <span className="font-semibold text-slate-700">{courseTitle}</span> không?
          </p>
        </div>
        <div className="flex justify-end gap-3 p-5">
          <Button type="button" variant="secondary" onClick={onCancel}>
            Giữ lại
          </Button>
          <Button type="button" variant="danger" onClick={onConfirm}>
            Hủy đăng ký
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

// ============================================================================
// Main Courses Page Component
// ============================================================================
export default function CoursesPage() {
  const { courses, loading, error, fetchCourses, deleteCourse } = useCourses();
  const { enroll, unenroll, getEnrollmentCheck, getMyEnrollments } = useEnrollment();
  const { user } = useAuth();
  const { showToast } = useToast();
  const confirm = useConfirm();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [enrollmentStatuses, setEnrollmentStatuses] = useState<Map<string, EnrollmentStatus>>(new Map());
  const [myEnrollments, setMyEnrollments] = useState<Enrollment[]>([]);
  const [myEnrollmentsLoading, setMyEnrollmentsLoading] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [selectedInstructorCourse, setSelectedInstructorCourse] = useState<Course | null>(null);
  const [confirmUnenroll, setConfirmUnenroll] = useState<{ courseId: string; title: string } | null>(null);
  const [courseScope, setCourseScope] = useState<CourseScope>('teaching');
  const [studentTab, setStudentTab] = useState<StudentCourseTab>('explore');
  const hasFetched = useRef(false);

  const canCreateCourse = user?.role === 'INSTRUCTOR' || user?.role === 'ADMIN';
  const isInstructor = user?.role === 'INSTRUCTOR';
  const isStudent = user?.role === 'STUDENT';
  const isStudentEnrolledTab = isStudent && studentTab === 'enrolled';
  const tabAnimationKey = isStudent ? studentTab : isInstructor ? courseScope : 'all-courses';
  const fetchCourseList = useCallback((scope = courseScope) =>
    fetchCourses(isInstructor ? { scope } : undefined), [courseScope, fetchCourses, isInstructor]);

  const loadMyEnrollments = useCallback(async () => {
    if (!isStudent) {
      setMyEnrollments([]);
      return;
    }

    setMyEnrollmentsLoading(true);
    try {
      const enrollments = await getMyEnrollments();
      setMyEnrollments(enrollments);
      setEnrollmentStatuses((prev) => {
        const next = new Map(prev);
        enrollments.forEach((enrollment) => next.set(enrollment.courseId, enrollment.status));
        return next;
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Không tải được khóa đã ghi danh';
      showToast(message, 'error');
    } finally {
      setMyEnrollmentsLoading(false);
    }
  }, [getMyEnrollments, isStudent, showToast]);

  useEffect(() => {
    if (!hasFetched.current) {
      hasFetched.current = true;
      fetchCourseList().catch((err) => {
        console.error('[CoursesPage] Failed to fetch courses:', err);
        hasFetched.current = false;
      });
    }
  }, [fetchCourseList]);

  useEffect(() => {
    if (!isInstructor || !hasFetched.current) return;
    fetchCourseList(courseScope).catch((err) => {
      console.error('[CoursesPage] Failed to fetch scoped courses:', err);
    });
  }, [courseScope, fetchCourseList, isInstructor]);

  useEffect(() => {
    void Promise.resolve().then(() => loadMyEnrollments());
  }, [loadMyEnrollments]);

  useEffect(() => {
    const checkEnrollments = async () => {
      if (!user || (user.role !== 'STUDENT' && user.role !== 'INSTRUCTOR') || courses.length === 0) return;
      const statuses = new Map<string, EnrollmentStatus>();
      for (const course of courses) {
        try {
          const result = await getEnrollmentCheck(course.id);
          if (result.status) statuses.set(course.id, result.status);
        } catch {
          // Not enrolled
        }
      }
      setEnrollmentStatuses(statuses);
    };
    if (courses.length > 0 && user) {
      checkEnrollments();
    }
  }, [courses, getEnrollmentCheck, user]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (isStudentEnrolledTab) {
      return;
    }
    fetchCourses({
      search: searchQuery,
      category: selectedCategory,
      ...(isInstructor ? { scope: courseScope } : {}),
    });
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    if (isStudentEnrolledTab) {
      return;
    }
    fetchCourses({
      search: searchQuery,
      category,
      ...(isInstructor ? { scope: courseScope } : {}),
    });
  };

  const handleEnroll = async (courseId: string) => {
    try {
      const enrollment = await enroll(courseId);
      setEnrollmentStatuses((prev) => new Map(prev).set(courseId, enrollment.status));
      if (isStudent) {
        await loadMyEnrollments();
      }
      showToast(
        enrollment.status === 'PENDING'
          ? 'Đã gửi yêu cầu học. Vui lòng chờ giảng viên duyệt.'
          : 'Đăng ký khóa học thành công!',
        'success',
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Đăng ký thất bại';
      showToast(message, 'error');
      console.error('Failed to enroll:', err);
    }
  };

  const handleUnenroll = async (courseId: string) => {
    try {
      await unenroll(courseId);
      setEnrollmentStatuses((prev) => new Map(prev).set(courseId, 'DROPPED'));
      if (isStudent) {
        await loadMyEnrollments();
      }
      setConfirmUnenroll(null);
      showToast('Hủy đăng ký khoá học thành công!', 'success');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Hủy đăng ký thất bại';
      showToast(message, 'error');
      console.error('Failed to unenroll:', err);
    }
  };

  const requestUnenroll = (courseId: string, title: string) => {
    setConfirmUnenroll({ courseId, title });
  };

  const handleEdit = (course: Course) => {
    setEditingCourse(course);
    setIsFormOpen(true);
  };

  const handleDelete = async (courseId: string, courseInstructorId: string) => {
    if (user?.role !== 'ADMIN' && user?.id !== courseInstructorId) {
      showToast('Bạn không có quyền xóa khoá học này!', 'warning');
      return;
    }
    const confirmed = await confirm({
      title: 'Xóa khóa học',
      message: 'Bạn có chắc chắn muốn xóa khóa học này?',
      confirmLabel: 'Xóa khóa học',
      cancelLabel: 'Hủy',
      variant: 'danger',
    });
    if (!confirmed) return;
    try {
      await deleteCourse(courseId);
      showToast('Xóa khoá học thành công!', 'success');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Xóa khoá học thất bại';
      showToast(message, 'error');
      console.error('Failed to delete course:', err);
    }
  };

  const getStatusBadge = (status: string) => {
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
    return (
      <Badge variant={variants[status] || 'neutral'}>
        {labels[status] || status}
      </Badge>
    );
  };

  const filteredEnrollments = myEnrollments.filter((enrollment) => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return true;
    return (enrollment.courseTitle || enrollment.courseId).toLowerCase().includes(query);
  });

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Khóa học</h1>
          <p className="mt-1 text-slate-500">
            {canCreateCourse
              ? 'Quản lý và khám phá các khoá học của bạn.'
              : 'Khám phá các khoá học để đăng ký học.'}
          </p>
        </div>

        {canCreateCourse && (
          <Button
            className="gap-2 shadow-sm"
            onClick={() => {
              setEditingCourse(null);
              setIsFormOpen(true);
            }}
          >
            <Plus className="w-4 h-4" />
            Tạo khoá học
          </Button>
        )}
      </div>

      {/* Tabs */}
      {(isInstructor || isStudent) && (
        <div className="inline-flex rounded-xl bg-slate-100 p-1 shadow-inner">
          {isInstructor ? (
            <>
              <button
                type="button"
                onClick={() => setCourseScope('teaching')}
                className={`pressable rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-200 ${
                  courseScope === 'teaching'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                Khóa của tôi
              </button>
              <button
                type="button"
                onClick={() => setCourseScope('explore')}
                className={`pressable rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-200 ${
                  courseScope === 'explore'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                Khám phá khóa học
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setStudentTab('explore')}
                className={`pressable rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-200 ${
                  studentTab === 'explore'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                Khám phá khóa học
              </button>
              <button
                type="button"
                onClick={() => setStudentTab('enrolled')}
                className={`pressable rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-200 ${
                  studentTab === 'enrolled'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                Khóa đã ghi danh
              </button>
            </>
          )}
        </div>
      )}

      {/* Search Bar - Modern Design */}
      <Card className="border-slate-200 shadow-sm">
        <CardBody className="p-4">
          <form onSubmit={handleSearch} className="flex gap-2">
            {/* Search Input */}
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm kiếm khoá học..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-xl border border-surface-200 bg-surface-50 text-surface-900 placeholder-surface-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 focus:outline-none transition-all duration-200"
              />
            </div>

            {/* Filter Button */}
            <Button
              type="submit"
              variant="secondary"
              className="h-12 px-6 gap-2 border-slate-200 hover:border-violet-300 hover:bg-violet-50"
            >
              <Filter className="w-4 h-4" />
              <span className="hidden sm:inline">Tìm kiếm</span>
            </Button>
          </form>
          {!isStudentEnrolledTab && (
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
          )}
        </CardBody>
      </Card>

      {/* Error State */}
      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-red-600">
          <strong>Lỗi:</strong> {error}
        </div>
      )}

      {/* Loading Skeleton */}
      {!isStudentEnrolledTab && loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="skeleton rounded-2xl overflow-hidden"
            >
              <div className="h-40 bg-slate-200" />
              <div className="p-5 space-y-4">
                <div className="h-6 bg-slate-200 rounded w-3/4" />
                <div className="h-4 bg-slate-200 rounded w-full" />
                <div className="h-4 bg-slate-200 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      )}

      {isStudentEnrolledTab && myEnrollmentsLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[1, 2, 3].map((item, index) => (
            <div key={item} className="stagger-enter h-48 skeleton rounded-2xl border border-slate-100 bg-white" style={staggerStyle(index)} />
          ))}
        </div>
      )}

      {/* Courses Grid */}
      {!isStudentEnrolledTab && !loading && courses.length > 0 && (
        <div key={`courses-${tabAnimationKey}`} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {courses.map((course, index) => (
            <div
              key={`${tabAnimationKey}-${course.id}`}
              className="stagger-enter"
              style={staggerStyle(index)}
            >
              <CourseCard
                course={course}
                enrollmentStatus={enrollmentStatuses.get(course.id) || null}
                onEnroll={() => handleEnroll(course.id)}
                getStatusBadge={getStatusBadge}
                canCreateCourse={canCreateCourse}
                currentUserId={user?.id}
                currentUserRole={user?.role}
                onEdit={handleEdit}
                onDelete={() => handleDelete(course.id, course.instructorId)}
                onInstructorClick={setSelectedInstructorCourse}
              />
            </div>
          ))}
        </div>
      )}

      {isStudentEnrolledTab && !myEnrollmentsLoading && filteredEnrollments.length > 0 && (
        <div key={`enrollments-${tabAnimationKey}`} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredEnrollments.map((enrollment, index) => (
            <div
              key={`${tabAnimationKey}-${enrollment.id}`}
              className="stagger-enter"
              style={staggerStyle(index)}
            >
              <EnrolledCourseCard
                enrollment={enrollment}
                onUnenroll={() => requestUnenroll(enrollment.courseId, enrollment.courseTitle || `Khóa học ${enrollment.courseId.slice(0, 8)}`)}
              />
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isStudentEnrolledTab && !loading && courses.length === 0 && (
        <Card className="border-slate-200">
          <CardBody className="py-20 text-center">
            <div className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-violet-100 to-indigo-100 flex items-center justify-center">
              <Layers className="w-12 h-12 text-violet-500" />
            </div>
            <h3 className="text-xl font-bold text-slate-700 mb-2">
              Chưa có khoá học nào
            </h3>
            <p className="text-slate-500 max-w-md mx-auto mb-8">
              {canCreateCourse
                ? 'Hãy tạo khoá học đầu tiên của bạn để bắt đầu giảng dạy!'
                : 'Hiện tại chưa có khoá học nào. Vui lòng quay lại sau.'}
            </p>
            {canCreateCourse && (
              <Button
                className="gap-2 shadow-sm"
                onClick={() => {
                  setEditingCourse(null);
                  setIsFormOpen(true);
                }}
              >
                <Plus className="w-4 h-4" />
                Tạo khoá học đầu tiên
              </Button>
            )}
          </CardBody>
        </Card>
      )}

      {isStudentEnrolledTab && !myEnrollmentsLoading && filteredEnrollments.length === 0 && (
        <Card className="border-slate-200">
          <CardBody className="py-20 text-center">
            <div className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-violet-100 to-indigo-100 flex items-center justify-center">
              <GraduationCap className="w-12 h-12 text-violet-500" />
            </div>
            <h3 className="text-xl font-bold text-slate-700 mb-2">
              Chưa có khóa đã ghi danh
            </h3>
            <p className="text-slate-500 max-w-md mx-auto mb-8">
              Chuyển sang tab Khám phá khóa học để tìm khóa phù hợp và bắt đầu học.
            </p>
            <Button onClick={() => setStudentTab('explore')}>
              Khám phá khóa học
            </Button>
          </CardBody>
        </Card>
      )}

      {/* Course Form Modal */}
      <CourseForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingCourse(null);
        }}
        onSuccess={() => {
          void fetchCourseList();
        }}
        editCourse={editingCourse ? {
            ...editingCourse,
            category: editingCourse.category || '',
            status: editingCourse.status,
            enrollmentPolicy: editingCourse.enrollmentPolicy || 'OPEN',
          } : null}
      />

      <AnimatePresence>
        {selectedInstructorCourse && (
          <InstructorProfileModal
            course={selectedInstructorCourse}
            onClose={() => setSelectedInstructorCourse(null)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {confirmUnenroll && (
          <ConfirmUnenrollModal
            courseTitle={confirmUnenroll.title}
            onCancel={() => setConfirmUnenroll(null)}
            onConfirm={() => {
              void handleUnenroll(confirmUnenroll.courseId);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
