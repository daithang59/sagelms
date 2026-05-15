import { useEffect, useState } from 'react';
import { AnimatedPopup, Button } from '@/components/ui';
import { useCourses } from '@/hooks';
import { useToast } from '@/components/Toast';
import { X, Image as ImageIcon } from 'lucide-react';
import type { CourseStatus, EnrollmentPolicy } from '@/types/course';

interface CourseFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  publishedLessonsCount?: number;
  editCourse?: {
    id: string;
    title: string;
    description: string;
    category: string;
    thumbnailUrl: string | null;
    status: CourseStatus;
    enrollmentPolicy: EnrollmentPolicy;
  } | null;
}

const categories = [
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
  'Other',
];

const statusOptions: Array<{ value: CourseStatus; label: string }> = [
  { value: 'DRAFT', label: 'Bản nháp' },
  { value: 'PUBLISHED', label: 'Xuất bản' },
  { value: 'ARCHIVED', label: 'Lưu trữ' },
];

const enrollmentPolicyOptions: Array<{ value: EnrollmentPolicy; label: string; description: string }> = [
  {
    value: 'OPEN',
    label: 'Công khai',
    description: 'Người học được vào khóa ngay sau khi đăng ký.',
  },
  {
    value: 'APPROVAL_REQUIRED',
    label: 'Cần duyệt',
    description: 'Giảng viên/admin phải duyệt trước khi người học vào khóa.',
  },
];

export default function CourseForm({ isOpen, onClose, onSuccess, editCourse, publishedLessonsCount }: CourseFormProps) {
  const { createCourse, updateCourse, loading } = useCourses();
  const { showToast } = useToast();

  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    category: string;
    thumbnailUrl: string;
    status: CourseStatus;
    enrollmentPolicy: EnrollmentPolicy;
  }>({
    title: editCourse?.title || '',
    description: editCourse?.description || '',
    category: editCourse?.category || '',
    thumbnailUrl: editCourse?.thumbnailUrl || '',
    status: editCourse?.status || 'DRAFT',
    enrollmentPolicy: editCourse?.enrollmentPolicy || 'OPEN',
  });

  useEffect(() => {
    void Promise.resolve().then(() => {
      setFormData({
        title: editCourse?.title || '',
        description: editCourse?.description || '',
        category: editCourse?.category || '',
        thumbnailUrl: editCourse?.thumbnailUrl || '',
        status: editCourse?.status || 'DRAFT',
        enrollmentPolicy: editCourse?.enrollmentPolicy || 'OPEN',
      });
    });
  }, [editCourse, isOpen]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (formData.status === 'PUBLISHED') {
      if (!editCourse) {
        showToast('Hãy tạo khóa ở trạng thái bản nháp, thêm bài học rồi mới xuất bản.', 'warning');
        return;
      }
      if (publishedLessonsCount !== undefined && publishedLessonsCount < 1) {
        showToast('Cần có ít nhất 1 bài học đã xuất bản trước khi xuất bản khóa học.', 'warning');
        return;
      }
      if (!formData.category || formData.description.trim().length < 30) {
        showToast('Vui lòng bổ sung danh mục và mô tả đủ rõ trước khi xuất bản khóa học.', 'warning');
        return;
      }
    }

    try {
      if (editCourse) {
        await updateCourse(editCourse.id, formData);
        showToast('Cập nhật khóa học thành công!', 'success');
      } else {
        await createCourse(formData);
        showToast('Tạo khóa học thành công!', 'success');
      }
      onSuccess?.();
      onClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Lưu khóa học thất bại';
      showToast(message, 'error');
      console.error('Failed to save course:', error);
    }
  };

  return (
    <AnimatedPopup
      isOpen={isOpen}
      onClose={onClose}
      zIndexClassName="z-[100]"
      labelledBy="course-form-title"
      panelClassName="m-4 max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl shadow-slate-950/20"
    >
        <div className="flex items-center justify-between border-b border-slate-200 p-6">
          <h2 id="course-form-title" className="text-xl font-bold text-slate-800">
            {editCourse ? 'Chỉnh sửa khóa học' : 'Tạo khóa học mới'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 transition-colors hover:bg-slate-100"
            aria-label="Đóng"
          >
            <X className="h-5 w-5 text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 p-6">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Ảnh thumbnail
            </label>
            <div className="relative rounded-xl border-2 border-dashed border-slate-300 transition-colors hover:border-violet-400">
              <div className="flex flex-col items-center justify-center py-8">
                {formData.thumbnailUrl ? (
                  <div className="relative w-full max-w-md">
                    <img
                      src={formData.thumbnailUrl}
                      alt="Thumbnail"
                      className="h-48 w-full rounded-lg object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, thumbnailUrl: '' })}
                      className="absolute right-2 top-2 rounded-lg bg-white p-1 shadow-md hover:bg-slate-100"
                      aria-label="Xóa ảnh"
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
              Tên khóa học <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(event) => setFormData({ ...formData, title: event.target.value })}
              placeholder="VD: Lập trình Java từ cơ bản đến nâng cao"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition-all focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Mô tả <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              rows={4}
              value={formData.description}
              onChange={(event) => setFormData({ ...formData, description: event.target.value })}
              placeholder="Mô tả chi tiết về khóa học..."
              className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 outline-none transition-all focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Danh mục
              </label>
              <select
                value={formData.category}
                onChange={(event) => setFormData({ ...formData, category: event.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none transition-all focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
              >
                <option value="">Chọn danh mục</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Trạng thái
              </label>
              <select
                value={formData.status}
                onChange={(event) => setFormData({ ...formData, status: event.target.value as CourseStatus })}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none transition-all focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Cách đăng ký
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              {enrollmentPolicyOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, enrollmentPolicy: option.value })}
                  className={`rounded-xl border p-4 text-left transition ${
                    formData.enrollmentPolicy === option.value
                      ? 'border-violet-400 bg-violet-50 ring-2 ring-violet-100'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <span className="block text-sm font-semibold text-slate-800">{option.label}</span>
                  <span className="mt-1 block text-xs leading-relaxed text-slate-500">{option.description}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
              Hủy
            </Button>
            <Button type="submit" isLoading={loading} className="flex-1">
              {editCourse ? 'Lưu thay đổi' : 'Tạo khóa học'}
            </Button>
          </div>
        </form>
    </AnimatedPopup>
  );
}
