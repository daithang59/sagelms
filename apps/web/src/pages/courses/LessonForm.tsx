import { useState } from 'react';
import { Button } from '@/components/ui';
import { useLessons } from '@/hooks';
import { useToast } from '@/components/Toast';
import { X, PlayCircle, FileText, FileQuestion, Link as LinkIcon } from 'lucide-react';
import type { ContentType } from '@/types/lesson';

interface LessonFormProps {
  isOpen: boolean;
  onClose: () => void;
  courseId: string;
  onSuccess?: () => void;
}

const lessonTypes = [
  { value: 'VIDEO' as const, label: 'Video', icon: PlayCircle },
  { value: 'TEXT' as const, label: 'Bài viết', icon: FileText },
  { value: 'QUIZ' as const, label: 'Bài kiểm tra', icon: FileQuestion },
  { value: 'LINK' as const, label: 'Liên kết', icon: LinkIcon },
];

export default function LessonForm({ isOpen, onClose, courseId, onSuccess }: LessonFormProps) {
  const { createLesson, loading } = useLessons();
  const { showToast } = useToast();

  const [formData, setFormData] = useState<{
    title: string;
    type: ContentType;
    contentUrl: string;
    textContent: string;
    durationMinutes: number;
  }>({
    title: '',
    type: 'VIDEO',
    contentUrl: '',
    textContent: '',
    durationMinutes: 0,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await createLesson(courseId, formData);
      showToast('Thêm bài học thành công!', 'success');
      onSuccess?.();
      onClose();
      setFormData({
        title: '',
        type: 'VIDEO',
        contentUrl: '',
        textContent: '',
        durationMinutes: 0,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Thêm bài học thất bại';
      showToast(message, 'error');
      console.error('Failed to create lesson:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl m-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-xl font-bold text-slate-800">Thêm bài học mới</h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Tiêu đề <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="VD: Giới thiệu về Java"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 outline-none transition-all"
            />
          </div>

          {/* Type */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Loại bài học
            </label>
            <div className="grid grid-cols-4 gap-2">
              {lessonTypes.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, type: type.value })}
                  className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                    formData.type === type.value
                      ? 'border-violet-500 bg-violet-50 text-violet-700'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <type.icon className="w-6 h-6" />
                  <span className="text-xs font-medium">{type.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Content URL (for VIDEO, LINK) */}
          {(formData.type === 'VIDEO' || formData.type === 'LINK') && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                {formData.type === 'VIDEO' ? 'URL Video' : 'URL Liên kết'}
              </label>
              <input
                type="url"
                value={formData.contentUrl}
                onChange={(e) => setFormData({ ...formData, contentUrl: e.target.value })}
                placeholder={formData.type === 'VIDEO' ? 'https://youtube.com/watch?v=...' : 'https://...'}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 outline-none transition-all"
              />
            </div>
          )}

          {/* Text Content (for TEXT) */}
          {formData.type === 'TEXT' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Nội dung
              </label>
              <textarea
                rows={6}
                value={formData.textContent}
                onChange={(e) => setFormData({ ...formData, textContent: e.target.value })}
                placeholder="Nhập nội dung bài học..."
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 outline-none transition-all resize-none"
              />
            </div>
          )}

          {/* Duration */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Thời lượng (phút)
            </label>
            <input
              type="number"
              min={0}
              value={formData.durationMinutes}
              onChange={(e) => setFormData({ ...formData, durationMinutes: parseInt(e.target.value) || 0 })}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 outline-none transition-all"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
              Huỷ
            </Button>
            <Button type="submit" isLoading={loading} className="flex-1">
              Thêm bài học
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
