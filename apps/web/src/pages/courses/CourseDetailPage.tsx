import { useEffect, useState, type FormEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardBody, Button, Badge } from '@/components/ui';
import { useCourses, useLessons, useEnrollment } from '@/hooks';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/Toast';
import {
  ArrowLeft,
  BookOpen,
  Users,
  Clock,
  PlayCircle,
  FileText,
  Link as LinkIcon,
  CheckCircle,
  Plus,
  Trash2,
  Eye,
  GraduationCap,
  Mail,
  UserRound,
  ExternalLink,
  Award,
  X,
  UserX,
  UserCheck,
} from 'lucide-react';
import type { Course, Enrollment, EnrollmentStatus } from '@/types/course';
import LessonForm from './LessonForm';
import CourseForm from './CourseForm';

function getEnrollmentStatusLabel(status: string) {
  if (status === 'PENDING') return 'Chờ duyệt';
  if (status === 'ACTIVE') return 'Đang học';
  if (status === 'COMPLETED') return 'Hoàn thành';
  if (status === 'DROPPED') return 'Đã hủy';
  if (status === 'REJECTED') return 'Bị từ chối';
  const labels: Record<string, string> = {
    ACTIVE: 'Đang học',
    COMPLETED: 'Hoàn thành',
    DROPPED: 'Đã hủy',
  };
  return labels[status] || status;
}

function getEnrollmentStatusVariant(status: string): 'success' | 'warning' | 'error' | 'neutral' {
  if (status === 'PENDING') return 'warning';
  if (status === 'REJECTED') return 'error';
  const variants: Record<string, 'success' | 'warning' | 'error' | 'neutral'> = {
    ACTIVE: 'success',
    COMPLETED: 'neutral',
    DROPPED: 'warning',
  };
  return variants[status] || 'neutral';
}

function getParticipantRoleLabel(role?: string | null) {
  if (role === 'INSTRUCTOR') return 'Giảng viên học';
  if (role === 'ADMIN') return 'Admin';
  return 'Học viên';
}

function getParticipantRoleVariant(role?: string | null): 'info' | 'brand' | 'neutral' {
  if (role === 'INSTRUCTOR') return 'info';
  if (role === 'ADMIN') return 'brand';
  return 'neutral';
}

function ParticipantRow({
  enrollment,
  onDrop,
  onApprove,
  onReject,
}: {
  enrollment: Enrollment;
  onDrop: () => void;
  onApprove: () => void;
  onReject: () => void;
}) {
  const displayName = enrollment.studentFullName || enrollment.studentEmail || enrollment.studentId;
  const canDrop = enrollment.status !== 'DROPPED';

  return (
    <div className="flex items-start gap-3 p-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-sm font-bold text-violet-700">
        {displayName.charAt(0).toUpperCase()}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate font-medium text-slate-800">{displayName}</p>
          <Badge variant={getParticipantRoleVariant(enrollment.studentRole)}>
            {getParticipantRoleLabel(enrollment.studentRole)}
          </Badge>
          <Badge variant={getEnrollmentStatusVariant(enrollment.status)}>
            {getEnrollmentStatusLabel(enrollment.status)}
          </Badge>
        </div>
        <div className="mt-1 space-y-1 text-sm text-slate-500">
          {enrollment.studentEmail && (
            <span className="flex items-center gap-1">
              <Mail className="h-3.5 w-3.5" />
              {enrollment.studentEmail}
            </span>
          )}
          <span>Đăng ký: {new Date(enrollment.enrolledAt).toLocaleDateString('vi-VN')}</span>
        </div>
      </div>
      {enrollment.reviewNote && (
        <div className="max-w-xs rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
          Ghi chú: {enrollment.reviewNote}
        </div>
      )}
      {enrollment.status === 'PENDING' && (
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={onApprove}
            className="rounded-lg p-2 text-emerald-600 transition hover:bg-emerald-50"
            title="Duyệt yêu cầu"
            aria-label="Duyệt yêu cầu"
          >
            <UserCheck className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onReject}
            className="rounded-lg p-2 text-amber-600 transition hover:bg-amber-50"
            title="Từ chối yêu cầu"
            aria-label="Từ chối yêu cầu"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
      <button
        type="button"
        onClick={onDrop}
        disabled={!canDrop}
        className="rounded-lg p-2 text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-40"
        title="Đưa ra khỏi khóa học"
        aria-label="Đưa ra khỏi khóa học"
      >
        <UserX className="h-4 w-4" />
      </button>
    </div>
  );
}

function DropParticipantModal({
  enrollment,
  onClose,
  onSubmit,
}: {
  enrollment: Enrollment | null;
  onClose: () => void;
  onSubmit: (reason: string) => Promise<void>;
}) {
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (!enrollment) return;
    void Promise.resolve().then(() => setReason(''));
  }, [enrollment]);

  if (!enrollment) return null;

  const trimmedReason = reason.trim();
  const displayName = enrollment.studentFullName || enrollment.studentEmail || enrollment.studentId;

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (trimmedReason.length >= 10) {
      void onSubmit(trimmedReason);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
        <div className="flex items-start justify-between border-b border-slate-100 p-5">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Đưa người tham gia ra khỏi khóa</h2>
            <p className="mt-1 text-sm text-slate-500">{displayName}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            aria-label="Đóng"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          <div>
            <label htmlFor="drop-participant-reason" className="mb-1.5 block text-sm font-medium text-slate-700">
              Lý do
            </label>
            <textarea
              id="drop-participant-reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              minLength={10}
              maxLength={1000}
              required
              rows={4}
              placeholder="Ví dụ: Người học đăng ký nhầm khóa hoặc không còn phù hợp với lớp này."
              className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={onClose}>
              Hủy
            </Button>
            <Button type="submit" variant="danger" disabled={trimmedReason.length < 10}>
              Xác nhận
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ConfirmUnenrollModal({
  courseTitle,
  label,
  onCancel,
  onConfirm,
}: {
  courseTitle: string;
  label: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
        <div className="border-b border-slate-100 p-5">
          <h2 className="text-lg font-bold text-slate-900">{label}?</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-500">
            Bạn có chắc chắn muốn {label.toLowerCase()} khóa học <span className="font-semibold text-slate-700">{courseTitle}</span> không?
          </p>
        </div>
        <div className="flex justify-end gap-3 p-5">
          <Button type="button" variant="secondary" onClick={onCancel}>
            Giữ lại
          </Button>
          <Button type="button" variant="danger" onClick={onConfirm}>
            {label}
          </Button>
        </div>
      </div>
    </div>
  );
}

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
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
      </div>
    </div>
  );
}

export default function CourseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { fetchCourse, loading: courseLoading, error: courseError } = useCourses();
  const { lessons, loading: lessonsLoading, fetchLessonsByCourse, fetchLessonsForManagement, deleteLesson, publishLesson } = useLessons();
  const {
    enroll,
    unenroll,
    getEnrollmentCheck,
    getCourseStudents,
    dropCourseParticipant,
    approveCourseParticipant,
    rejectCourseParticipant,
  } = useEnrollment();
  const { showToast } = useToast();

  const [course, setCourse] = useState<Course | null>(null);
  const [enrollmentStatus, setEnrollmentStatus] = useState<EnrollmentStatus | null>(null);
  const [showLessonForm, setShowLessonForm] = useState(false);
  const [editingLesson, setEditingLesson] = useState(null);
  const [showCourseForm, setShowCourseForm] = useState(false);
  const [courseStudents, setCourseStudents] = useState<Enrollment[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [showInstructorProfile, setShowInstructorProfile] = useState(false);
  const [droppingEnrollment, setDroppingEnrollment] = useState<Enrollment | null>(null);
  const [showUnenrollConfirm, setShowUnenrollConfirm] = useState(false);

  const canCreateCourse = user?.role === 'INSTRUCTOR' || user?.role === 'ADMIN';
  const isOwner = canCreateCourse && course?.instructorId === user?.id;
  const isAdmin = user?.role === 'ADMIN';
  const canManageCourse = isOwner || isAdmin;
  const canEnroll = (user?.role === 'STUDENT' || user?.role === 'INSTRUCTOR') && !isOwner && !isAdmin;
  const isEnrolled = enrollmentStatus === 'ACTIVE' || enrollmentStatus === 'COMPLETED';
  const isPendingApproval = enrollmentStatus === 'PENDING';

  useEffect(() => {
    if (id) {
      fetchCourse(id)
        .then(setCourse)
        .catch(console.error);
    }
  }, [id, fetchCourse]);

  useEffect(() => {
    if (id && course) {
      const loadLessons = canManageCourse ? fetchLessonsForManagement : fetchLessonsByCourse;
      loadLessons(id);
    }
  }, [id, course, canManageCourse, fetchLessonsByCourse, fetchLessonsForManagement]);

  useEffect(() => {
    let cancelled = false;
    void Promise.resolve().then(async () => {
      if (!id || !canManageCourse) {
        if (!cancelled) setCourseStudents([]);
        return;
      }

      if (!cancelled) setStudentsLoading(true);
      try {
        const students = await getCourseStudents(id);
        if (!cancelled) setCourseStudents(students);
      } catch (err) {
        console.error('Failed to load course students:', err);
        if (!cancelled) setCourseStudents([]);
      } finally {
        if (!cancelled) setStudentsLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [id, canManageCourse, getCourseStudents]);

  useEffect(() => {
    if (id && user && (user.role === 'STUDENT' || user.role === 'INSTRUCTOR')) {
      getEnrollmentCheck(id)
        .then((result) => setEnrollmentStatus(result.status))
        .catch(() => setEnrollmentStatus(null));
    } else {
      void Promise.resolve().then(() => setEnrollmentStatus(null));
    }
  }, [id, user, getEnrollmentCheck]);

  const handleEnroll = async () => {
    if (!id) return;
    try {
      const enrollment = await enroll(id);
      setEnrollmentStatus(enrollment.status);
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

  const handleUnenroll = async () => {
    if (!id) return;
    try {
      await unenroll(id);
      setEnrollmentStatus('DROPPED');
      setShowUnenrollConfirm(false);
      showToast('Hủy đăng ký thành công!', 'success');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Hủy đăng ký thất bại';
      showToast(message, 'error');
      console.error('Failed to unenroll:', err);
    }
  };

  const handleDropParticipant = async (reason: string) => {
    if (!id || !droppingEnrollment) return;
    try {
      await dropCourseParticipant(id, droppingEnrollment.studentId, reason);
      setCourseStudents((prev) =>
        prev.map((item) =>
          item.id === droppingEnrollment.id ? { ...item, status: 'DROPPED' } : item,
        ),
      );
      setDroppingEnrollment(null);
      showToast('Đã đưa người tham gia ra khỏi khóa học.', 'success');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Thao tác thất bại';
      showToast(message, 'error');
    }
  };

  const handleApproveParticipant = async (enrollment: Enrollment) => {
    if (!id) return;
    try {
      const updated = await approveCourseParticipant(id, enrollment.studentId);
      setCourseStudents((prev) =>
        prev.map((item) => (item.id === enrollment.id ? { ...item, status: updated.status } : item)),
      );
      showToast('Đã duyệt yêu cầu học.', 'success');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Duyệt yêu cầu thất bại';
      showToast(message, 'error');
    }
  };

  const handleRejectParticipant = async (enrollment: Enrollment) => {
    if (!id) return;
    const reason = window.prompt('Nhập lý do từ chối yêu cầu học:');
    if (!reason || reason.trim().length < 5) return;
    try {
      const updated = await rejectCourseParticipant(id, enrollment.studentId, reason.trim());
      setCourseStudents((prev) =>
        prev.map((item) => (item.id === enrollment.id ? { ...item, status: updated.status } : item)),
      );
      showToast('Đã từ chối yêu cầu học.', 'success');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Từ chối yêu cầu thất bại';
      showToast(message, 'error');
    }
  };

  const handleStartLearning = () => {
    if (lessons.length > 0) {
      // Find first published lesson or just the first one
      const firstLesson = lessons.find(l => l.isPublished) || lessons[0];
      navigate(`/courses/${id}/lessons/${firstLesson.id}`);
    } else {
      showToast('Khoá học chưa có bài học nào', 'warning');
    }
  };

  const handleLessonClick = (lessonId: string) => {
    if (canEnroll && isPendingApproval) {
      showToast('Yêu cầu học của bạn đang chờ giảng viên duyệt.', 'warning');
      return;
    }
    if (canEnroll && !isEnrolled) {
      showToast('Vui lòng đăng ký khoá học để xem bài học này', 'warning');
      return;
    }
    navigate(`/courses/${id}/lessons/${lessonId}`);
  };

  const getLessonIcon = (type: string) => {
    switch (type) {
      case 'VIDEO':
        return <PlayCircle className="w-5 h-5" />;
      case 'TEXT':
        return <FileText className="w-5 h-5" />;
      case 'LINK':
        return <LinkIcon className="w-5 h-5" />;
      default:
        return <BookOpen className="w-5 h-5" />;
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
    return <Badge variant={variants[status] || 'neutral'}>{labels[status] || status}</Badge>;
  };

  if (courseLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (courseError || !course) {
    return (
      <div className="text-center py-20">
        <p className="text-red-500 mb-4">Không tìm thấy khoá học</p>
        <Button onClick={() => navigate('/courses')}>Quay lại</Button>
      </div>
    );
  }

  // Generate gradient based on course title
  const gradients = [
    'from-violet-500 via-purple-500 to-indigo-500',
    'from-cyan-500 via-blue-500 to-teal-500',
    'from-rose-500 via-pink-500 to-rose-400',
  ];
  const gradientIndex = course.title.charCodeAt(0) % gradients.length;

  return (
    <div className="space-y-8">
      {/* Back Button */}
      <button
        onClick={() => navigate('/courses')}
        className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        Quay lại danh sách khoá học
      </button>

      {/* Course Header */}
      <div className="relative">
        {/* Cover Image */}
        <div className={`h-64 rounded-2xl bg-gradient-to-br ${gradients[gradientIndex]} relative overflow-hidden`}>
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')]"></div>
          </div>

          {course.thumbnailUrl && (
            <img src={course.thumbnailUrl} alt={course.title} className="w-full h-full object-cover" />
          )}

          <div className="absolute inset-0 bg-black/30" />

          <div className="absolute bottom-6 left-6 right-6">
            <div className="flex items-center gap-3 mb-3">
              {getStatusBadge(course.status)}
              {course.category && (
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/20 text-white">
                  {course.category}
                </span>
              )}
            </div>
              <h1 className="text-3xl font-bold text-white">{course.title}</h1>
              <button
                type="button"
                onClick={() => setShowInstructorProfile(true)}
                className="mt-3 inline-flex max-w-full items-center gap-2 rounded-lg bg-white/15 px-3 py-2 text-sm font-medium text-white backdrop-blur-md transition-colors hover:bg-white/25"
              >
                <UserRound className="h-4 w-4 shrink-0" />
                <span className="truncate">{course.instructorFullName || 'Xem giảng viên'}</span>
              </button>
            </div>
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <Card>
            <CardBody>
              <h2 className="text-lg font-bold text-slate-800 mb-4">Mô tả khoá học</h2>
              <p className="text-slate-600 leading-relaxed">{course.description}</p>
            </CardBody>
          </Card>

          {/* Lessons */}
          <Card>
            <CardBody className="p-0">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-800">
                  Nội dung khoá học
                  <span className="ml-2 text-sm font-normal text-slate-500">
                    ({lessons.length} bài học)
                  </span>
                </h2>
                {canManageCourse && (
                  <Button
                    size="sm"
                    onClick={() => setShowLessonForm(!showLessonForm)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Thêm bài học
                  </Button>
                )}
              </div>

              {lessonsLoading ? (
                <div className="p-6 space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : lessons.length > 0 ? (
                <div className="max-h-[560px] divide-y divide-slate-100 overflow-y-auto">
                  {lessons.map((lesson) => (
                    <button
                      key={lesson.id}
                      onClick={() => handleLessonClick(lesson.id)}
                      className="w-full p-4 flex items-center gap-4 hover:bg-slate-50 transition-colors text-left"
                    >
                      <div className="w-10 h-10 rounded-xl bg-violet-100 text-violet-600 flex items-center justify-center">
                        {getLessonIcon(lesson.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-slate-800 truncate">{lesson.title}</h3>
                        <div className="flex items-center gap-3 text-sm text-slate-500">
                          <span className="capitalize">{lesson.type.toLowerCase()}</span>
                          {lesson.durationMinutes && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              {lesson.durationMinutes} phút
                            </span>
                          )}
                        </div>
                      </div>
                      {lesson.isPublished ? (
                        <Badge variant="success">Đã xuất bản</Badge>
                      ) : (
                        <Badge variant="warning">Bản nháp</Badge>
                      )}
                      {canManageCourse && (
                        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
                              try {
                                await publishLesson(lesson.id, !lesson.isPublished);
                                showToast(
                                  lesson.isPublished ? 'Bài học đã được ẩn!' : 'Bài học đã được xuất bản!',
                                  'success'
                                );
                              } catch (err) {
                                const message = err instanceof Error ? err.message : 'Cập nhật thất bại';
                                showToast(message, 'error');
                              }
                            }}
                            className="p-2 rounded-lg hover:bg-slate-100 text-slate-500"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
                              if (confirm('Xóa bài học này?')) {
                                try {
                                  await deleteLesson(lesson.id);
                                  showToast('Xóa bài học thành công!', 'success');
                                } catch (err) {
                                  const message = err instanceof Error ? err.message : 'Xóa bài học thất bại';
                                  showToast(message, 'error');
                                }
                              }
                            }}
                            className="p-2 rounded-lg hover:bg-red-50 text-red-500"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center">
                  <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500">Chưa có bài học nào</p>
                </div>
              )}
            </CardBody>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Enrollment Card */}
          <Card>
            <CardBody className="space-y-4">
              <div className="flex items-center justify-between text-sm text-slate-500">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  <span>{course.enrollmentCount} học viên</span>
                </div>
              </div>

              {canEnroll ? (
                isPendingApproval ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-amber-600">
                      <Clock className="w-5 h-5" />
                      <span className="font-medium">Yêu cầu học đang chờ duyệt</span>
                    </div>
                    <Button variant="secondary" className="w-full" onClick={() => setShowUnenrollConfirm(true)}>
                      Hủy yêu cầu
                    </Button>
                  </div>
                ) : isEnrolled ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-emerald-600">
                      <CheckCircle className="w-5 h-5" />
                      <span className="font-medium">Bạn đã đăng ký khoá học này</span>
                    </div>
                    <Button variant="secondary" className="w-full" onClick={() => setShowUnenrollConfirm(true)}>
                      Hủy đăng ký
                    </Button>
                    <Button className="w-full" onClick={handleStartLearning}>
                      <PlayCircle className="w-4 h-4 mr-2" />
                      Bắt đầu học
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Button className="w-full" onClick={handleEnroll}>
                      <GraduationCap className="w-4 h-4 mr-2" />
                      {course.enrollmentPolicy === 'APPROVAL_REQUIRED' ? 'Gửi yêu cầu học' : 'Đăng ký ngay'}
                    </Button>
                    {course.enrollmentPolicy === 'APPROVAL_REQUIRED' && (
                      <p className="text-xs leading-relaxed text-slate-500">
                        Giảng viên cần duyệt trước khi bạn xem nội dung khóa học.
                      </p>
                    )}
                  </div>
                )
              ) : canManageCourse ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-violet-600">
                    <BookOpen className="w-5 h-5" />
                    <span className="font-medium">Bạn là giảng viên của khoá học này</span>
                  </div>
                  <Button className="w-full" onClick={() => setShowCourseForm(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Chỉnh sửa khoá học
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-slate-500">
                    <BookOpen className="w-5 h-5" />
                    <span className="font-medium">Xem thông tin khoá học</span>
                  </div>
                </div>
              )}
            </CardBody>
          </Card>

          {canManageCourse && (
            <Card>
              <CardBody className="p-0">
                <div className="border-b border-slate-100 p-5">
                  <h2 className="text-lg font-bold text-slate-800">Người tham gia khóa học</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Bao gồm học viên và giảng viên khác đã đăng ký học khóa này.
                  </p>
                </div>

                {studentsLoading ? (
                  <div className="space-y-3 p-5">
                    {[1, 2, 3].map((item) => (
                      <div key={item} className="h-16 animate-pulse rounded-xl bg-slate-100" />
                    ))}
                  </div>
                ) : courseStudents.length > 0 ? (
                  <div className="max-h-[420px] divide-y divide-slate-100 overflow-y-auto">
                    {courseStudents.map((enrollment) => (
                      <ParticipantRow
                        key={enrollment.id}
                        enrollment={enrollment}
                        onDrop={() => setDroppingEnrollment(enrollment)}
                        onApprove={() => handleApproveParticipant(enrollment)}
                        onReject={() => handleRejectParticipant(enrollment)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center text-sm text-slate-500">
                    Chưa có người tham gia nào đăng ký khóa học này.
                  </div>
                )}
              </CardBody>
            </Card>
          )}
        </div>
      </div>

      {/* Lesson Form Modal */}
      {id && (
        <LessonForm
          isOpen={showLessonForm}
          onClose={() => {
            setShowLessonForm(false);
            setEditingLesson(null);
          }}
          courseId={id}
          onSuccess={() => (canManageCourse ? fetchLessonsForManagement(id) : fetchLessonsByCourse(id))}
          editLesson={editingLesson}
        />
      )}

      {/* Course Form Modal */}
      {course && (
        <CourseForm
          isOpen={showCourseForm}
          onClose={() => setShowCourseForm(false)}
          onSuccess={() => {
            if (id) fetchCourse(id).then(setCourse);
          }}
          editCourse={{
            ...course,
            category: course.category || '',
            status: course.status,
            enrollmentPolicy: course.enrollmentPolicy || 'OPEN',
          }}
        />
      )}

      <InstructorProfileModal
        course={showInstructorProfile ? course : null}
        onClose={() => setShowInstructorProfile(false)}
      />

      <DropParticipantModal
        enrollment={droppingEnrollment}
        onClose={() => setDroppingEnrollment(null)}
        onSubmit={handleDropParticipant}
      />

      {showUnenrollConfirm && course && (
        <ConfirmUnenrollModal
          courseTitle={course.title}
          label={isPendingApproval ? 'Hủy yêu cầu' : 'Hủy đăng ký'}
          onCancel={() => setShowUnenrollConfirm(false)}
          onConfirm={() => {
            void handleUnenroll();
          }}
        />
      )}
    </div>
  );
}
