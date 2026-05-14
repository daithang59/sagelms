import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { Button } from '@/components/ui';
import { useLessons } from '@/hooks';
import { useToast } from '@/components/Toast';
import apiClient from '@/lib/axios';
import { renderMarkdown } from '@/lib/markdown';
import PdfPreview from '@/components/pdf/PdfPreview';
import DOMPurify from 'dompurify';
import { File, FileText, Link as LinkIcon, PlayCircle, Upload, X } from 'lucide-react';
import type { ContentType, LessonRequest } from '@/types/lesson';

interface LessonFormProps {
  isOpen: boolean;
  onClose: () => void;
  courseId: string;
  onSuccess?: () => void;
  editLesson?: {
    id: string;
    title: string;
    type: ContentType;
    contentUrl: string | null;
    textContent: string | null;
    durationMinutes: number | null;
  } | null;
}

interface FileUploadResponse {
  fileName: string;
  contentType: string;
  size: number;
  url: string;
}

const lessonTypes = [
  { value: 'VIDEO' as const, label: 'Video', icon: PlayCircle },
  { value: 'TEXT' as const, label: 'Bài đọc', icon: FileText },
  { value: 'PDF' as const, label: 'PDF', icon: File },
  { value: 'LINK' as const, label: 'Liên kết', icon: LinkIcon },
];

const inputClass =
  'w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition-all focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20';

export default function LessonForm({ isOpen, onClose, courseId, onSuccess, editLesson }: LessonFormProps) {
  const { createLesson, updateLesson, loading } = useLessons();
  const { showToast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [pdfFile, setPdfFile] = useState<File | null>(null);

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

  useEffect(() => {
    void Promise.resolve().then(() => {
      setPdfFile(null);
      if (editLesson) {
        setFormData({
          title: editLesson.title,
          type: editLesson.type,
          contentUrl: editLesson.contentUrl || '',
          textContent: editLesson.textContent || '',
          durationMinutes: editLesson.durationMinutes || 0,
        });
      } else {
        setFormData({
          title: '',
          type: 'VIDEO',
          contentUrl: '',
          textContent: '',
          durationMinutes: 0,
        });
      }
    });
  }, [editLesson, isOpen]);

  const markdownPreview = DOMPurify.sanitize(renderMarkdown(formData.textContent || ''));
  const pdfPreviewSource = pdfFile || formData.contentUrl.trim();

  const updateType = (type: ContentType) => {
    setPdfFile(null);
    setFormData((current) => ({
      ...current,
      type,
      contentUrl: type === 'TEXT' ? '' : current.contentUrl,
      textContent: type === 'TEXT' ? current.textContent : '',
    }));
  };

  const readTextFile = async (file: File) => {
    const allowed = /\.(txt|md|markdown)$/i.test(file.name);
    if (!allowed) {
      showToast('Chỉ hỗ trợ file .txt, .md hoặc .markdown.', 'warning');
      return;
    }
    const text = await file.text();
    setFormData((current) => ({
      ...current,
      textContent: text,
      title: current.title || file.name.replace(/\.(txt|md|markdown)$/i, ''),
    }));
    showToast('Đã nạp nội dung file văn bản.', 'success');
  };

  const uploadPdf = async (file: File) => {
    const form = new FormData();
    form.append('file', file);
    const response = await apiClient.post<FileUploadResponse>('/content/files', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.url;
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    try {
      let contentUrl = formData.contentUrl.trim();
      if (formData.type === 'PDF' && pdfFile) {
        setUploading(true);
        contentUrl = await uploadPdf(pdfFile);
      }

      const payload: LessonRequest = {
        title: formData.title.trim(),
        type: formData.type,
        durationMinutes: formData.durationMinutes || undefined,
        contentUrl: formData.type === 'TEXT' ? undefined : contentUrl,
        textContent: formData.type === 'TEXT' ? formData.textContent : undefined,
      };

      if (editLesson) {
        await updateLesson(editLesson.id, payload);
        showToast('Cập nhật bài học thành công.', 'success');
      } else {
        await createLesson(courseId, payload);
        showToast('Thêm bài học thành công.', 'success');
      }
      onSuccess?.();
      onClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Lưu bài học thất bại';
      showToast(message, 'error');
      console.error('Failed to save lesson:', error);
    } finally {
      setUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative m-4 flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white p-6">
          <h2 className="text-xl font-bold text-slate-800">
            {editLesson ? 'Chỉnh sửa bài học' : 'Thêm bài học mới'}
          </h2>
          <button type="button" onClick={onClose} className="rounded-xl p-2 transition-colors hover:bg-slate-100" aria-label="Đóng">
            <X className="h-5 w-5 text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-6">
          <div>
            <label htmlFor="lesson-title" className="mb-2 block text-sm font-medium text-slate-700">
              Tiêu đề <span className="text-red-500">*</span>
            </label>
            <input
              id="lesson-title"
              type="text"
              required
              value={formData.title}
              onChange={(event) => setFormData({ ...formData, title: event.target.value })}
              placeholder="VD: Giới thiệu về Java"
              className={inputClass}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Loại bài học</label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {lessonTypes.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => updateType(type.value)}
                  className={`flex items-center gap-2 rounded-xl border-2 p-3 transition-all ${
                    formData.type === type.value
                      ? 'border-violet-500 bg-violet-50 text-violet-700'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <type.icon className="h-4 w-4 shrink-0" />
                  <span className="text-sm font-medium">{type.label}</span>
                </button>
              ))}
            </div>
          </div>

          {formData.type === 'VIDEO' && (
            <Field id="lesson-video-url" label="URL video">
              <input
                id="lesson-video-url"
                type="url"
                value={formData.contentUrl}
                onChange={(event) => setFormData({ ...formData, contentUrl: event.target.value })}
                placeholder="https://youtube.com/watch?v=..."
                className={inputClass}
              />
            </Field>
          )}

          {formData.type === 'LINK' && (
            <Field id="lesson-link-url" label="URL liên kết">
              <input
                id="lesson-link-url"
                type="url"
                value={formData.contentUrl}
                onChange={(event) => setFormData({ ...formData, contentUrl: event.target.value })}
                placeholder="https://..."
                className={inputClass}
              />
            </Field>
          )}

          {formData.type === 'PDF' && (
            <div className="space-y-3">
              <Field id="lesson-pdf-url" label="URL file PDF">
                <input
                  id="lesson-pdf-url"
                  type="url"
                  value={formData.contentUrl}
                  onChange={(event) => {
                    setPdfFile(null);
                    setFormData({ ...formData, contentUrl: event.target.value });
                  }}
                  placeholder="https://.../file.pdf hoặc upload file bên dưới"
                  className={inputClass}
                />
              </Field>
              <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border-2 border-dashed border-slate-200 p-4 transition hover:border-violet-300 hover:bg-violet-50/40">
                <div className="flex items-center gap-3">
                  <Upload className="h-5 w-5 text-violet-600" />
                  <div>
                    <p className="text-sm font-semibold text-slate-800">Upload PDF từ máy</p>
                    <p className="text-xs text-slate-500">{pdfFile ? pdfFile.name : 'Tối đa 25MB, chỉ hỗ trợ .pdf'}</p>
                  </div>
                </div>
                <input
                  type="file"
                  accept="application/pdf,.pdf"
                  className="sr-only"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (!file) return;
                    const isPdf = file.type === 'application/pdf' || /\.pdf$/i.test(file.name);
                    if (!isPdf) {
                      showToast('Chỉ hỗ trợ file PDF.', 'warning');
                      return;
                    }
                    setPdfFile(file);
                    setFormData((current) => ({
                      ...current,
                      contentUrl: '',
                      title: current.title || file.name.replace(/\.pdf$/i, ''),
                    }));
                  }}
                />
              </label>
              {pdfPreviewSource && (
                <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                  <PdfPreview
                    source={pdfPreviewSource}
                    title="Xem trước PDF"
                    heightClassName="h-[420px]"
                  />
                </div>
              )}
            </div>
          )}

          {formData.type === 'TEXT' && (
            <div className="space-y-3">
              <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border-2 border-dashed border-slate-200 p-4 transition hover:border-violet-300 hover:bg-violet-50/40">
                <div className="flex items-center gap-3">
                  <Upload className="h-5 w-5 text-violet-600" />
                  <div>
                    <p className="text-sm font-semibold text-slate-800">Upload TXT/Markdown</p>
                    <p className="text-xs text-slate-500">Nội dung file sẽ được đưa vào ô soạn thảo bên dưới.</p>
                  </div>
                </div>
                <input
                  type="file"
                  accept=".txt,.md,.markdown,text/plain,text/markdown"
                  className="sr-only"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) void readTextFile(file);
                  }}
                />
              </label>
              <Field id="lesson-text-content" label="Nội dung">
                <textarea
                  id="lesson-text-content"
                  rows={8}
                  required
                  value={formData.textContent}
                  onChange={(event) => setFormData({ ...formData, textContent: event.target.value })}
                  placeholder="Nhập nội dung bài học hoặc upload file .txt/.md..."
                  className={`${inputClass} resize-none`}
                />
              </Field>
              {formData.textContent.trim() && (
                <div className="rounded-xl border border-slate-200 bg-slate-50">
                  <div className="border-b border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700">
                    Xem trước Markdown
                  </div>
                  <div
                    className="markdown-body max-h-72 overflow-y-auto p-4"
                    dangerouslySetInnerHTML={{ __html: markdownPreview }}
                  />
                </div>
              )}
            </div>
          )}

          <Field id="lesson-duration" label="Thời lượng (phút)">
            <input
              id="lesson-duration"
              type="number"
              min={0}
              value={formData.durationMinutes}
              onChange={(event) => setFormData({ ...formData, durationMinutes: Number.parseInt(event.target.value, 10) || 0 })}
              className={inputClass}
            />
          </Field>
          </div>

          <div className="sticky bottom-0 z-10 flex gap-3 border-t border-slate-200 bg-white p-6 shadow-[0_-12px_24px_rgba(15,23,42,0.06)]">
            <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
              Hủy
            </Button>
            <Button type="submit" isLoading={loading || uploading} className="flex-1">
              {editLesson ? 'Lưu thay đổi' : 'Thêm bài học'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ id, label, children }: { id: string; label: string; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm font-medium text-slate-700">
        {label}
      </label>
      {children}
    </div>
  );
}
