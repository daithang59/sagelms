import { useState, type FormEvent } from 'react';
import { AnimatedPopup, Button } from '@/components/ui';
import { useAssessments } from '@/hooks';
import { useToast } from '@/components/Toast';
import { Image as ImageIcon, X } from 'lucide-react';
import type { Assessment, AssessmentStatus } from '@/types/assessment';

interface AssessmentFormProps {
  isOpen: boolean;
  courseId: string;
  onClose: () => void;
  onSuccess?: () => void;
  editAssessment?: Assessment | null;
}

const categories = [
  'Programming',
  'Web Development',
  'Data Science',
  'Algorithm',
  'Cybersecurity',
  'Design',
  'Business',
  'Other',
];

const statusOptions: Array<{ value: AssessmentStatus; label: string }> = [
  { value: 'DRAFT', label: 'Bản nháp' },
  { value: 'PUBLISHED', label: 'Xuất bản' },
  { value: 'ARCHIVED', label: 'Lưu trữ' },
];

export default function AssessmentForm({ isOpen, courseId, onClose, onSuccess, editAssessment }: AssessmentFormProps) {
  return (
    <AnimatedPopup
      isOpen={isOpen}
      onClose={onClose}
      zIndexClassName="z-[100]"
      labelledBy="Assessment-form-title"
      panelClassName="m-4 max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl shadow-slate-950/20"
    >
      <AssessmentFormDialog
        key={editAssessment?.id ?? 'new-Assessment'}
        onClose={onClose}
        onSuccess={onSuccess}
        courseId={courseId}
        editAssessment={editAssessment}
      />
    </AnimatedPopup>
  );
}

function createInitialFormData(editAssessment?: Assessment | null) {
  return {
    title: editAssessment?.title || '',
    description: editAssessment?.description || '',
    thumbnailUrl: editAssessment?.thumbnailUrl || '',
    category: editAssessment?.category || '',
    status: editAssessment?.status || 'DRAFT',
    timeLimitMinutes: editAssessment?.timeLimitMinutes ?? '',
    maxAttempts: editAssessment?.maxAttempts ?? 1,
  };
}

function AssessmentFormDialog({ courseId, onClose, onSuccess, editAssessment }: Omit<AssessmentFormProps, 'isOpen'>) {
  const { createAssessment, updateAssessment, loading } = useAssessments();
  const { showToast } = useToast();
  const [formData, setFormData] = useState(() => createInitialFormData(editAssessment));

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const payload = {
      ...formData,
      timeLimitMinutes: formData.timeLimitMinutes === '' ? null : Number(formData.timeLimitMinutes),
      maxAttempts: Math.max(1, Number(formData.maxAttempts || 1)),
    };
    try {
      if (editAssessment) {
        await updateAssessment(courseId, editAssessment.id, payload);
        showToast('Cập nhật bài kiểm tra thành công!', 'success');
      } else {
        await createAssessment(courseId, payload);
        showToast('Tạo bài kiểm tra thành công!', 'success');
      }
      onSuccess?.();
      onClose();
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Lưu bài kiểm tra thất bại', 'error');
    }
  };

  return (
    <>
      <div className="flex items-center justify-between border-b border-slate-200 p-6">
        <h2 id="Assessment-form-title" className="text-xl font-bold text-slate-800">
          {editAssessment ? 'Chỉnh sửa bài kiểm tra' : 'Tạo bài kiểm tra mới'}
        </h2>
        <button onClick={onClose} className="rounded-xl p-2 transition-colors hover:bg-slate-100">
          <X className="h-5 w-5 text-slate-500" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 p-6">
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Ảnh thumbnail</label>
          <div className="rounded-xl border-2 border-dashed border-slate-300 p-8 transition-colors hover:border-violet-400">
            <div className="flex flex-col items-center justify-center">
              {formData.thumbnailUrl ? (
                <div className="relative w-full max-w-md">
                  <img src={formData.thumbnailUrl} alt="Thumbnail" className="h-48 w-full rounded-lg object-cover" />
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, thumbnailUrl: '' })}
                    className="absolute right-2 top-2 rounded-lg bg-white p-1 shadow-md hover:bg-slate-100"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <>
                  <ImageIcon className="mb-3 h-12 w-12 text-slate-300" />
                  <p className="mb-2 text-sm text-slate-500">Nhập URL ảnh thumbnail</p>
                </>
              )}
              <input
                type="url"
                placeholder="https://example.com/image.jpg"
                value={formData.thumbnailUrl}
                onChange={(event) => setFormData({ ...formData, thumbnailUrl: event.target.value })}
                className="mt-3 w-full max-w-md rounded-lg border border-slate-200 px-4 py-2 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Tên bài kiểm tra <span className="text-red-500">*</span>
          </label>
          <input
            required
            value={formData.title}
            onChange={(event) => setFormData({ ...formData, title: event.target.value })}
            placeholder="VD: JavaScript Assessment 2026"
            className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition-all focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Mô tả</label>
          <textarea
            rows={4}
            value={formData.description}
            onChange={(event) => setFormData({ ...formData, description: event.target.value })}
            placeholder="Mô tả nội dung và thể lệ bài kiểm tra..."
            className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 outline-none transition-all focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Danh mục</label>
            <select
              value={formData.category}
              onChange={(event) => setFormData({ ...formData, category: event.target.value })}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none transition-all focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
            >
              <option value="">Chọn danh mục</option>
              {categories.map((category) => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Trạng thái</label>
            <select
              value={formData.status}
              onChange={(event) => setFormData({ ...formData, status: event.target.value as AssessmentStatus })}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none transition-all focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Thời gian mặc định (phút)</label>
            <input
              type="number"
              min={0}
              value={formData.timeLimitMinutes}
              onChange={(event) => setFormData({ ...formData, timeLimitMinutes: event.target.value === '' ? '' : Number(event.target.value) })}
              placeholder="Không giới hạn"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition-all focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Số lượt làm</label>
            <input
              type="number"
              min={1}
              value={formData.maxAttempts}
              onChange={(event) => setFormData({ ...formData, maxAttempts: Number(event.target.value) })}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition-all focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
            />
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">Hủy</Button>
          <Button type="submit" isLoading={loading} className="flex-1">
            {editAssessment ? 'Lưu thay đổi' : 'Tạo bài kiểm tra'}
          </Button>
        </div>
      </form>
    </>
  );
}
