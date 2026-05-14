import { useEffect, useState, useRef } from 'react';
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
  Clock,
  GraduationCap,
  ArrowRight,
  Layers,
  Edit,
  Trash2,
} from 'lucide-react';
import type { Course } from '@/types/course';
import CourseForm from './CourseForm';

// ============================================================================
// Premium Course Card Component
// ============================================================================
interface CourseCardProps {
  course: Course;
  isEnrolled: boolean;
  onEnroll: () => void;
  onUnenroll: () => void;
  getStatusBadge: (status: string) => React.ReactNode;
  canCreateCourse: boolean;
  currentUserId?: string;
  currentUserRole?: string;
  onEdit: (course: Course) => void;
  onDelete: (courseId: string, instructorId: string) => void;
}

function CourseCard({
  course,
  isEnrolled,
  onEnroll,
  onUnenroll,
  getStatusBadge,
  canCreateCourse,
  currentUserId,
  currentUserRole,
  onEdit,
  onDelete,
}: CourseCardProps) {
  const isOwner = canCreateCourse && course.instructorId === currentUserId;
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
    <div className="group relative bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100 overflow-hidden">
      {/* Cover Area - Fixed height with consistent gradient */}
      <div className={`relative h-40 bg-gradient-to-br ${gradients[gradientIndex]} flex items-center justify-center overflow-hidden`}>
        {/* Decorative pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')]"></div>
        </div>

        {/* Thumbnail or Icon */}
        <div className="relative z-10">
          {course.thumbnailUrl ? (
            <img
              src={course.thumbnailUrl}
              alt={course.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <BookOpen className="w-8 h-8 text-white" />
            </div>
          )}
        </div>

        {/* Status Badge */}
        <div className="absolute top-3 right-3 z-20">
          {getStatusBadge(course.status)}
        </div>

        {/* Category Tag */}
        {course.category && (
          <div className="absolute bottom-3 left-3 z-20">
            <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-white/20 backdrop-blur-md text-white border border-white/20">
              {course.category}
            </span>
          </div>
        )}

        {/* Owner Actions */}
        {isOwner && (
          <div className="absolute top-3 left-3 z-20 flex gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(course);
              }}
              className="p-2 rounded-lg bg-white/20 backdrop-blur-md hover:bg-white/30 transition-colors"
            >
              <Edit className="w-4 h-4 text-white" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(course.id, course.instructorId);
              }}
              className="p-2 rounded-lg bg-white/20 backdrop-blur-md hover:bg-red-500/80 transition-colors"
            >
              <Trash2 className="w-4 h-4 text-white" />
            </button>
          </div>
        )}
      </div>

      {/* Content Area */}
      <CardBody className="p-5 space-y-4">
        {/* Title */}
        <h3 className="font-bold text-slate-800 text-lg leading-tight line-clamp-2 min-h-[3.5rem]">
          {course.title}
        </h3>

        {/* Description */}
        <p className="text-slate-500 text-sm line-clamp-2 min-h-[2.5rem]">
          {course.description}
        </p>

        {/* Meta Info */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <div className="flex items-center gap-4 text-sm text-slate-400">
            <div className="flex items-center gap-1.5">
              <Users className="w-4 h-4" />
              <span className="font-medium">{course.enrollmentCount}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              <span>{new Date(course.updatedAt).toLocaleDateString('vi-VN', { day: 'numeric', month: 'short' })}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-2">
          {isEnrolled ? (
            <div className="flex gap-2">
              <Button
                variant="secondary"
                className="flex-1 justify-center"
                onClick={onUnenroll}
              >
                <GraduationCap className="w-4 h-4 mr-2" />
                <span className="truncate">Đã ghi danh</span>
              </Button>
              <Button
                variant="outline"
                className="flex-1 justify-center"
                onClick={() => navigate(`/courses/${course.id}`)}
              >
                <span className="truncate">Học ngay</span>
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          ) : isOwner || (currentUserId && currentUserRole === 'ADMIN') ? (
            // Owner or Admin - show "Quản lý" button (no enrollment needed)
            <Button
              variant="outline"
              className="w-full justify-center"
              onClick={() => navigate(`/courses/${course.id}`)}
            >
              <span className="truncate">Quản lý</span>
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : currentUserRole === 'STUDENT' ? (
            // Student - show enroll button
            <Button className="w-full justify-center" onClick={onEnroll}>
              <Plus className="w-4 h-4 mr-2" />
              Đăng ký ngay
            </Button>
          ) : (
            // Instructor (non-owner) - show "Chi tiết" button only
            <Button
              variant="outline"
              className="w-full justify-center"
              onClick={() => navigate(`/courses/${course.id}`)}
            >
              <span className="truncate">Chi tiết</span>
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </CardBody>
    </div>
  );
}

// ============================================================================
// Main Courses Page Component
// ============================================================================
export default function CoursesPage() {
  const { courses, loading, error, fetchCourses, deleteCourse } = useCourses();
  const { enroll, unenroll, checkEnrollment } = useEnrollment();
  const { user } = useAuth();
  const { showToast } = useToast();
  const confirm = useConfirm();
  const [searchQuery, setSearchQuery] = useState('');
  const [enrolledCourses, setEnrolledCourses] = useState<Set<string>>(new Set());
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const hasFetched = useRef(false);

  const canCreateCourse = user?.role === 'INSTRUCTOR' || user?.role === 'ADMIN';

  useEffect(() => {
    if (!hasFetched.current) {
      hasFetched.current = true;
      fetchCourses().catch((err) => {
        console.error('[CoursesPage] Failed to fetch courses:', err);
        hasFetched.current = false;
      });
    }
  }, [fetchCourses]);

  useEffect(() => {
    const checkEnrollments = async () => {
      // Only check enrollments for students
      if (!user || user.role !== 'STUDENT' || courses.length === 0) return;
      const enrolled = new Set<string>();
      for (const course of courses) {
        try {
          const isEnrolled = await checkEnrollment(course.id);
          if (isEnrolled) enrolled.add(course.id);
        } catch {
          // Not enrolled
        }
      }
      setEnrolledCourses(enrolled);
    };
    if (courses.length > 0 && user) {
      checkEnrollments();
    }
  }, [courses, checkEnrollment, user]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCourses({ search: searchQuery });
  };

  const handleEnroll = async (courseId: string) => {
    try {
      await enroll(courseId);
      setEnrolledCourses((prev) => new Set([...prev, courseId]));
      showToast('Đăng ký khoá học thành công!', 'success');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Đăng ký thất bại';
      showToast(message, 'error');
      console.error('Failed to enroll:', err);
    }
  };

  const handleUnenroll = async (courseId: string) => {
    try {
      await unenroll(courseId);
      setEnrolledCourses((prev) => {
        const newSet = new Set(prev);
        newSet.delete(courseId);
        return newSet;
      });
      showToast('Hủy đăng ký khoá học thành công!', 'success');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Hủy đăng ký thất bại';
      showToast(message, 'error');
      console.error('Failed to unenroll:', err);
    }
  };

  const handleEdit = (course: Course) => {
    setEditingCourse(course);
    setIsFormOpen(true);
  };

  const handleDelete = async (courseId: string, courseInstructorId: string) => {
    if (user?.id !== courseInstructorId) {
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

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Khoá học</h1>
          <p className="mt-1 text-slate-500">
            {canCreateCourse
              ? 'Quản lý và khám phá các khoá học của bạn.'
              : 'Khám phá các khoá học để đăng ký học.'}
          </p>
        </div>

        {canCreateCourse && (
          <Button
            className="gap-2 shadow-lg shadow-violet-500/25"
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
        </CardBody>
      </Card>

      {/* Error State */}
      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-red-600">
          <strong>Lỗi:</strong> {error}
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-slate-100 overflow-hidden animate-pulse"
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

      {/* Courses Grid */}
      {!loading && courses.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {courses.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              isEnrolled={enrolledCourses.has(course.id)}
              onEnroll={() => handleEnroll(course.id)}
              onUnenroll={() => handleUnenroll(course.id)}
              getStatusBadge={getStatusBadge}
              canCreateCourse={canCreateCourse}
              currentUserId={user?.id}
              currentUserRole={user?.role}
              onEdit={handleEdit}
              onDelete={() => handleDelete(course.id, course.instructorId)}
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && courses.length === 0 && (
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
                className="gap-2 shadow-lg shadow-violet-500/25"
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

      {/* Course Form Modal */}
      <CourseForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingCourse(null);
        }}
        onSuccess={() => {
          fetchCourses();
        }}
        editCourse={editingCourse ? {
          ...editingCourse,
          category: editingCourse.category || '',
          status: editingCourse.status
        } : null}
      />
    </div>
  );
}
