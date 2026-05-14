import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Badge, Button, Card, CardBody } from '@/components/ui';
import { useLessons } from '@/hooks';
import { useCourses } from '@/hooks/useCourses';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/Toast';
import { renderMarkdown } from '@/lib/markdown';
import PdfPreview from '@/components/pdf/PdfPreview';
import DOMPurify from 'dompurify';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock,
  Edit3,
  ExternalLink,
  Eye,
  EyeOff,
  File,
  FileText,
  Link as LinkIcon,
  ListVideo,
  PlayCircle,
} from 'lucide-react';
import type { Lesson } from '@/types/lesson';
import type { Course } from '@/types/course';

const typeLabels: Record<string, string> = {
  VIDEO: 'Video',
  TEXT: 'Bài đọc',
  PDF: 'Tài liệu PDF',
  LINK: 'Liên kết',
};

function getTypeIcon(type: string) {
  switch (type) {
    case 'VIDEO':
      return <PlayCircle className="h-5 w-5" />;
    case 'TEXT':
      return <FileText className="h-5 w-5" />;
    case 'LINK':
      return <LinkIcon className="h-5 w-5" />;
    case 'PDF':
      return <File className="h-5 w-5" />;
    default:
      return <FileText className="h-5 w-5" />;
  }
}

function toYouTubeEmbedUrl(url: string) {
  return url.replace('watch?v=', 'embed/').replace('youtu.be/', 'www.youtube.com/embed/');
}

export default function LessonDetailPage() {
  const { id: lessonId, courseId } = useParams<{ id: string; courseId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    fetchLesson,
    fetchLessonsByCourse,
    fetchLessonsForManagement,
    publishLesson,
  } = useLessons();
  const { fetchCourse } = useCourses();
  const { showToast } = useToast();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [courseLessons, setCourseLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [lessonsLoading, setLessonsLoading] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const isAdmin = user?.role === 'ADMIN';
  const isCourseOwner = Boolean(course && user?.id && course.instructorId === user.id);
  const canManageLesson = isAdmin || isCourseOwner;

  useEffect(() => {
    let cancelled = false;
    if (!lessonId) return;

    void Promise.resolve().then(async () => {
      if (!cancelled) setLoading(true);
      try {
        const loadedLesson = await fetchLesson(lessonId);
        if (!cancelled) setLesson(loadedLesson);
      } catch (err) {
        showToast('Không tải được bài học', 'error');
        console.error('Failed to load lesson:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [lessonId, fetchLesson, showToast]);

  useEffect(() => {
    let cancelled = false;
    if (!courseId) return;

    void Promise.resolve().then(async () => {
      try {
        const loadedCourse = await fetchCourse(courseId);
        if (!cancelled) setCourse(loadedCourse);
      } catch (err) {
        console.error('Failed to load course for lesson ownership:', err);
        if (!cancelled) setCourse(null);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [courseId, fetchCourse]);

  useEffect(() => {
    let cancelled = false;
    if (!courseId) return;

    void Promise.resolve().then(async () => {
      if (!cancelled) setLessonsLoading(true);
      const loader = canManageLesson ? fetchLessonsForManagement : fetchLessonsByCourse;
      try {
        const loadedLessons = await loader(courseId, true);
        if (!cancelled) {
          setCourseLessons([...loadedLessons].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)));
        }
      } catch (err) {
        console.error('Failed to load course lessons:', err);
        if (!cancelled) setCourseLessons([]);
      } finally {
        if (!cancelled) setLessonsLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [courseId, canManageLesson, fetchLessonsByCourse, fetchLessonsForManagement]);

  const currentIndex = useMemo(
    () => courseLessons.findIndex((item) => item.id === lessonId),
    [courseLessons, lessonId],
  );
  const previousLesson = currentIndex > 0 ? courseLessons[currentIndex - 1] : null;
  const nextLesson = currentIndex >= 0 && currentIndex < courseLessons.length - 1 ? courseLessons[currentIndex + 1] : null;
  const lessonPosition = currentIndex >= 0 ? currentIndex + 1 : null;

  const navigateToLesson = (targetLesson: Lesson | null) => {
    if (!targetLesson || !courseId) return;
    navigate(`/courses/${courseId}/lessons/${targetLesson.id}`);
  };

  const handleTogglePublish = async () => {
    if (!lesson) return;

    setPublishing(true);
    try {
      const updatedLesson = await publishLesson(lesson.id, !lesson.isPublished);
      setLesson(updatedLesson);
      setCourseLessons((items) => items.map((item) => (item.id === updatedLesson.id ? updatedLesson : item)));
      showToast(updatedLesson.isPublished ? 'Đã xuất bản bài học.' : 'Đã ẩn bài học.', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Cập nhật trạng thái bài học thất bại.', 'error');
    } finally {
      setPublishing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-500 border-t-transparent" />
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="py-20 text-center">
        <p className="mb-4 text-red-500">Không tìm thấy bài học</p>
        <Button onClick={() => navigate(courseId ? `/courses/${courseId}` : '/courses')}>
          Quay lại
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1360px] space-y-5">
      <button
        onClick={() => navigate(courseId ? `/courses/${courseId}` : '/courses')}
        className="flex items-center gap-2 text-slate-600 transition-colors hover:text-slate-900"
      >
        <ArrowLeft className="h-5 w-5" />
        Quay lại khóa học
      </button>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <main className="min-w-0 space-y-5">
          <Card className="overflow-hidden">
            <CardBody className="space-y-6 p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex min-w-0 items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-600">
                    {getTypeIcon(lesson.type)}
                  </div>
                  <div className="min-w-0">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <Badge variant={lesson.isPublished ? 'success' : 'warning'}>
                        {lesson.isPublished ? 'Đã xuất bản' : 'Bản nháp'}
                      </Badge>
                      <span className="text-sm text-slate-500">{typeLabels[lesson.type] || lesson.type}</span>
                      {lessonPosition && (
                        <span className="text-sm text-slate-400">
                          Bài {lessonPosition} / {courseLessons.length}
                        </span>
                      )}
                    </div>
                    <h1 className="text-2xl font-bold leading-tight text-slate-900 lg:text-3xl">{lesson.title}</h1>
                    {lesson.durationMinutes && (
                      <div className="mt-2 flex items-center gap-1.5 text-sm text-slate-500">
                        <Clock className="h-4 w-4" />
                        {lesson.durationMinutes} phút
                      </div>
                    )}
                  </div>
                </div>

                {canManageLesson && (
                  <div className="flex shrink-0 flex-wrap gap-2">
                    <Button variant="secondary" size="sm" onClick={handleTogglePublish} isLoading={publishing}>
                      {lesson.isPublished ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      {lesson.isPublished ? 'Ẩn bài' : 'Xuất bản'}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => navigate(courseId ? `/courses/${courseId}` : '/courses')}>
                      <Edit3 className="h-4 w-4" />
                      Quản lý khóa
                    </Button>
                  </div>
                )}
              </div>

              <LessonContent lesson={lesson} />
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <Button
                  variant="secondary"
                  disabled={!previousLesson}
                  onClick={() => navigateToLesson(previousLesson)}
                  className="justify-center"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Bài trước
                </Button>
                <div className="text-center text-sm text-slate-500">
                  {lessonPosition ? `Bài ${lessonPosition} trong ${courseLessons.length}` : 'Đang học'}
                </div>
                <Button
                  disabled={!nextLesson}
                  onClick={() => navigateToLesson(nextLesson)}
                  className="justify-center"
                >
                  Bài tiếp theo
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </CardBody>
          </Card>
        </main>

        <aside className="xl:sticky xl:top-24 xl:self-start">
          <Card className="overflow-hidden">
            <CardBody className="p-0">
              <div className="border-b border-slate-100 p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                    <ListVideo className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="font-bold text-slate-900">Nội dung khóa học</h2>
                    <p className="text-sm text-slate-500">{courseLessons.length} bài học</p>
                  </div>
                </div>
              </div>

              {lessonsLoading ? (
                <div className="space-y-3 p-4">
                  {[1, 2, 3, 4].map((item) => (
                    <div key={item} className="h-16 skeleton rounded-xl" />
                  ))}
                </div>
              ) : courseLessons.length > 0 ? (
                <div className="max-h-[calc(100vh-220px)] divide-y divide-slate-100 overflow-y-auto">
                  {courseLessons.map((item, index) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => navigateToLesson(item)}
                      className={`flex w-full items-start gap-3 p-4 text-left transition-colors ${
                        item.id === lesson.id ? 'bg-violet-50' : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                        item.id === lesson.id ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-500'
                      }`}
                      >
                        {index + 1}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="shrink-0 text-slate-400">{getTypeIcon(item.type)}</span>
                          <p className="line-clamp-2 text-sm font-semibold text-slate-800">{item.title}</p>
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                          <span>{typeLabels[item.type] || item.type}</span>
                          {item.durationMinutes && <span>{item.durationMinutes} phút</span>}
                          {!item.isPublished && <Badge variant="warning">Nháp</Badge>}
                        </div>
                      </div>
                      {item.id === lesson.id && <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-violet-600" />}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-sm text-slate-500">
                  Chưa có danh sách bài học.
                </div>
              )}
            </CardBody>
          </Card>
        </aside>
      </div>
    </div>
  );
}

function LessonContent({ lesson }: { lesson: Lesson }) {
  if (lesson.type === 'VIDEO' && lesson.contentUrl) {
    const isYoutube = lesson.contentUrl.includes('youtube.com') || lesson.contentUrl.includes('youtu.be');
    return (
      <div className="space-y-3">
        {isYoutube ? (
          <div className="aspect-video overflow-hidden rounded-2xl bg-slate-950 shadow-sm">
            <iframe
              src={toYouTubeEmbedUrl(lesson.contentUrl)}
              title={lesson.title}
              className="h-full w-full"
              allowFullScreen
            />
          </div>
        ) : (
          <div className="flex aspect-video items-center justify-center overflow-hidden rounded-2xl bg-slate-950">
            <a
              href={lesson.contentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 text-white transition-colors hover:text-violet-300"
            >
              <PlayCircle className="h-12 w-12" />
              <span className="font-medium">Mở video</span>
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        )}
      </div>
    );
  }

  if (lesson.type === 'TEXT') {
    const renderedContent = DOMPurify.sanitize(renderMarkdown(lesson.textContent || ''));
    return (
      <div className="rounded-2xl border border-slate-100 bg-white p-1">
        <div className="markdown-body max-w-none rounded-xl bg-slate-50/60 p-6">
          {lesson.textContent ? (
            <div
              className="leading-7 text-slate-700"
              dangerouslySetInnerHTML={{ __html: renderedContent }}
            />
          ) : (
            <p className="italic text-slate-400">Chưa có nội dung bài học.</p>
          )}
        </div>
      </div>
    );
  }

  if (lesson.type === 'PDF' && lesson.contentUrl) {
    return <PdfPreview source={lesson.contentUrl} title={lesson.title} />;
  }

  if (lesson.type === 'LINK' && lesson.contentUrl) {
    return (
      <div className="space-y-4 rounded-2xl border border-blue-100 bg-blue-50 p-8 text-center">
        <LinkIcon className="mx-auto h-10 w-10 text-blue-500" />
        <p className="text-slate-600">Bài học này chứa một liên kết bên ngoài.</p>
        <a
          href={lesson.contentUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-medium text-white transition-colors hover:bg-blue-700"
        >
          <ExternalLink className="h-4 w-4" />
          Mở liên kết
        </a>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-10 text-center text-slate-500">
      Bài học chưa có nội dung hiển thị.
    </div>
  );
}
