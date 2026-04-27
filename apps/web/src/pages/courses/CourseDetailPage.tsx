import { useEffect, useState } from 'react';
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
} from 'lucide-react';
import type { Course } from '@/types/course';
import LessonForm from './LessonForm';
import CourseForm from './CourseForm';

export default function CourseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { fetchCourse, loading: courseLoading, error: courseError } = useCourses();
  const { lessons, loading: lessonsLoading, fetchLessonsByCourse, fetchLessonsForManagement, deleteLesson, publishLesson } = useLessons();
  const { enroll, unenroll, checkEnrollment } = useEnrollment();
  const { showToast } = useToast();

  const [course, setCourse] = useState<Course | null>(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [showLessonForm, setShowLessonForm] = useState(false);
  const [editingLesson, setEditingLesson] = useState(null);
  const [showCourseForm, setShowCourseForm] = useState(false);

  const canCreateCourse = user?.role === 'INSTRUCTOR' || user?.role === 'ADMIN';
  const isOwner = canCreateCourse && course?.instructorId === user?.id;
  const isAdmin = user?.role === 'ADMIN';
  const canEnroll = user?.role === 'STUDENT' && !isOwner && !isAdmin;

  useEffect(() => {
    if (id) {
      fetchCourse(id)
        .then(setCourse)
        .catch(console.error);
    }
  }, [id, fetchCourse]);

  useEffect(() => {
    if (id && course) {
      const loadLessons = isOwner || isAdmin ? fetchLessonsForManagement : fetchLessonsByCourse;
      loadLessons(id);
    }
  }, [id, course, isOwner, isAdmin, fetchLessonsByCourse, fetchLessonsForManagement]);

  useEffect(() => {
    // Only check enrollment for students
    if (id && user && user.role === 'STUDENT') {
      checkEnrollment(id)
        .then(setIsEnrolled)
        .catch(() => setIsEnrolled(false));
    } else {
      setIsEnrolled(false);
    }
  }, [id, user, checkEnrollment]);

  const handleEnroll = async () => {
    if (!id) return;
    try {
      await enroll(id);
      setIsEnrolled(true);
      showToast('Đăng ký khoá học thành công!', 'success');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Đăng ký thất bại';
      showToast(message, 'error');
      console.error('Failed to enroll:', err);
    }
  };

  const handleUnenroll = async () => {
    if (!id) return;
    if (!confirm('Bạn có chắc chắn muốn hủy đăng ký khoá học này?')) return;
    try {
      await unenroll(id);
      setIsEnrolled(false);
      showToast('Hủy đăng ký thành công!', 'success');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Hủy đăng ký thất bại';
      showToast(message, 'error');
      console.error('Failed to unenroll:', err);
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
                {isOwner && (
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
                <div className="divide-y divide-slate-100">
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
                      {isOwner && (
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
                isEnrolled ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-emerald-600">
                      <CheckCircle className="w-5 h-5" />
                      <span className="font-medium">Bạn đã đăng ký khoá học này</span>
                    </div>
                    <Button variant="secondary" className="w-full" onClick={handleUnenroll}>
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
                      Đăng ký ngay
                    </Button>
                  </div>
                )
              ) : isOwner ? (
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
          onSuccess={() => (isOwner || isAdmin ? fetchLessonsForManagement(id) : fetchLessonsByCourse(id))}
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
            status: course.status
          }}
        />
      )}
    </div>
  );
}
