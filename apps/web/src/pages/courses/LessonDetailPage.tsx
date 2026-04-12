import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardBody, Button, Badge } from '@/components/ui';
import { useLessons } from '@/hooks';
import { useToast } from '@/components/Toast';
import {
  ArrowLeft,
  PlayCircle,
  FileText,
  Link as LinkIcon,
  FileQuestion,
  File,
  Clock,
  ExternalLink,
} from 'lucide-react';
import type { Lesson } from '@/types/lesson';

export default function LessonDetailPage() {
  const { id: lessonId, courseId } = useParams<{ id: string; courseId: string }>();
  const navigate = useNavigate();
  const { fetchLesson } = useLessons();
  const { showToast } = useToast();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!lessonId) return;
    fetchLesson(lessonId)
      .then(setLesson)
      .catch((err) => {
        showToast('Không tải được bài học', 'error');
        console.error('Failed to load lesson:', err);
      })
      .finally(() => setLoading(false));
  }, [lessonId, fetchLesson, showToast]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'VIDEO': return <PlayCircle className="w-5 h-5" />;
      case 'TEXT': return <FileText className="w-5 h-5" />;
      case 'QUIZ': return <FileQuestion className="w-5 h-5" />;
      case 'LINK': return <LinkIcon className="w-5 h-5" />;
      case 'PDF': return <File className="w-5 h-5" />;
      case 'ASSIGNMENT': return <FileText className="w-5 h-5" />;
      default: return <FileText className="w-5 h-5" />;
    }
  };

  const getYouTubeEmbedUrl = (url: string) => {
    try {
      let videoId = '';
      if (url.includes('youtube.com/watch')) {
        const urlParams = new URLSearchParams(new URL(url).search);
        videoId = urlParams.get('v') || '';
      } else if (url.includes('youtu.be/')) {
        videoId = url.split('youtu.be/')[1].split('?')[0];
      } else if (url.includes('youtube.com/embed/')) {
        return url;
      }
      return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
    } catch {
      return url;
    }
  };

  const typeLabels: Record<string, string> = {
    VIDEO: 'Video',
    TEXT: 'Bài đọc',
    QUIZ: 'Bài kiểm tra',
    ASSIGNMENT: 'Bài tập',
    PDF: 'Tài liệu PDF',
    LINK: 'Liên kết',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="text-center py-20">
        <p className="text-red-500 mb-4">Không tìm thấy bài học</p>
        <Button onClick={() => navigate(courseId ? '/courses/' + courseId : '/courses')}>
          Quay lại
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Back + Header */}
      <button
        onClick={() => navigate(courseId ? `/courses/${courseId}` : '/courses')}
        className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        Quay lại khoá học
      </button>

      <Card>
        <CardBody>
          <div className="flex items-start justify-between gap-4 mb-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-violet-100 text-violet-600 flex items-center justify-center flex-shrink-0">
                {getTypeIcon(lesson.type)}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant={lesson.isPublished ? 'success' : 'warning'}>
                    {lesson.isPublished ? 'Đã xuất bản' : 'Bản nháp'}
                  </Badge>
                  <span className="text-sm text-slate-500">{typeLabels[lesson.type] || lesson.type}</span>
                </div>
                <h1 className="text-2xl font-bold text-slate-800">{lesson.title}</h1>
                {lesson.durationMinutes && (
                  <div className="flex items-center gap-1.5 mt-1 text-sm text-slate-500">
                    <Clock className="w-4 h-4" />
                    {lesson.durationMinutes} phút
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── VIDEO ── */}
          {lesson.type === 'VIDEO' && lesson.contentUrl && (
            <div className="space-y-3">
              {lesson.contentUrl.includes('youtube.com') || lesson.contentUrl.includes('youtu.be') ? (
                <div className="aspect-video rounded-xl overflow-hidden bg-slate-900">
                  <iframe
                    src={lesson.contentUrl.replace('watch?v=', 'embed/').replace('youtu.be/', 'www.youtube.com/embed/')}
                    title={lesson.title}
                    className="w-full h-full"
                    allowFullScreen
                  />
                </div>
              ) : (
                <div className="aspect-video rounded-xl overflow-hidden bg-slate-900 flex items-center justify-center">
                  <a
                    href={lesson.contentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-white hover:text-violet-300 transition-colors"
                  >
                    <PlayCircle className="w-12 h-12" />
                    <span className="font-medium">Mở video</span>
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              )}
            </div>
          )}

          {/* ── TEXT ── */}
          {lesson.type === 'TEXT' && (
            <div className="prose prose-slate max-w-none">
              {lesson.textContent ? (
                <div
                  className="text-slate-700 leading-relaxed whitespace-pre-wrap"
                  dangerouslySetInnerHTML={{ __html: lesson.textContent }}
                />
              ) : (
                <p className="text-slate-400 italic">Chưa có nội dung bài học.</p>
              )}
            </div>
          )}

          {/* ── PDF ── */}
          {lesson.type === 'PDF' && lesson.contentUrl && (
            <div className="space-y-3">
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-100">
                <div className="flex items-center gap-3 mb-2">
                  <File className="w-6 h-6 text-amber-600" />
                  <span className="font-medium text-amber-800">Tài liệu PDF</span>
                </div>
                <a
                  href={lesson.contentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-amber-700 hover:text-amber-900 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  Mở PDF trong tab mới
                </a>
              </div>
              <iframe
                src={lesson.contentUrl}
                title={lesson.title}
                className="w-full h-[600px] rounded-xl border border-slate-200"
              />
            </div>
          )}

          {/* ── LINK ── */}
          {lesson.type === 'LINK' && lesson.contentUrl && (
            <div className="p-6 rounded-xl bg-blue-50 border border-blue-100 text-center space-y-4">
              <LinkIcon className="w-10 h-10 text-blue-500 mx-auto" />
              <p className="text-slate-600">Bài học này chứa một liên kết bên ngoài.</p>
              <a
                href={lesson.contentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                Mở liên kết
              </a>
            </div>
          )}

          {/* ── QUIZ / ASSIGNMENT ── */}
          {(lesson.type === 'QUIZ' || lesson.type === 'ASSIGNMENT') && (
            <div className="p-8 text-center rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              {lesson.type === 'QUIZ' ? (
                <FileQuestion className="w-10 h-10 text-slate-400 mx-auto" />
              ) : (
                <FileText className="w-10 h-10 text-slate-400 mx-auto" />
              )}
              <p className="text-slate-600">
                {lesson.type === 'QUIZ'
                  ? 'Bài kiểm tra — tính năng đang được phát triển.'
                  : 'Bài tập — tính năng đang được phát triển.'}
              </p>
              <Button
                variant="secondary"
                onClick={() => navigate(courseId ? `/courses/${courseId}` : '/courses')}
              >
                Quay lại khoá học
              </Button>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
