import { useEffect, useState } from 'react';
import { Button } from '@/components/ui';
import { useCourses } from '@/hooks';
import { useToast } from '@/components/Toast';
import { X, Image as ImageIcon } from 'lucide-react';
import type { CourseStatus } from '@/types/course';

interface CourseFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  editCourse?: {
    id: string;
    title: string;
    description: string;
    category: string;
    thumbnailUrl: string | null;
    status: CourseStatus;
  } | null;
}

const categories = [
  'Programming',
  'Web Development',
  'Data Science',
  'Mobile Development',
  'DevOps',
  'Design',
  'Business',
  'Marketing',
  'Other',
];

const statusOptions = [
  { value: 'DRAFT', label: 'Bản nháp' },
  { value: 'PUBLISHED', label: 'Xuất bản' },
  { value: 'ARCHIVED', label: 'Lưu trữ' },
];

export default function CourseForm({ isOpen, onClose, onSuccess, editCourse }: CourseFormProps) {
  const { createCourse, updateCourse, loading } = useCourses();
  const { showToast } = useToast();

  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    category: string;
    thumbnailUrl: string;
    status: CourseStatus;
  }>({
    title: editCourse?.title || '',
    description: editCourse?.description || '',
    category: editCourse?.category || '',
    thumbnailUrl: editCourse?.thumbnailUrl || '',
    status: (editCourse?.status === 'DRAFT' || editCourse?.status === 'PUBLISHED' || editCourse?.status === 'ARCHIVED') ? editCourse.status : 'DRAFT',
  });

  useEffect(() => {
    setFormData({
      title: editCourse?.title || '',
      description: editCourse?.description || '',
      category: editCourse?.category || '',
      thumbnailUrl: editCourse?.thumbnailUrl || '',
      status: (editCourse?.status === 'DRAFT' || editCourse?.status === 'PUBLISHED' || editCourse?.status === 'ARCHIVED') ? editCourse.status : 'DRAFT',
    });
  }, [editCourse, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editCourse) {
        await updateCourse(editCourse.id, formData);
        showToast('Cập nhật khoá học thành công!', 'success');
      } else {
        await createCourse(formData);
        showToast('Tạo khoá học thành công!', 'success');
      }
      onSuccess?.();
      onClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Lưu khoá học thất bại';
      showToast(message, 'error');
      console.error('Failed to save course:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl m-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-xl font-bold text-slate-800">
            {editCourse ? 'Chỉnh sửa khoá học' : 'Tạo khoá học mới'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Thumbnail */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Ảnh thumbnail
            </label>
            <div className="relative border-2 border-dashed border-slate-300 rounded-xl hover:border-violet-400 transition-colors">
              <div className="flex flex-col items-center justify-center py-8">
                {formData.thumbnailUrl ? (
                  <div className="relative w-full max-w-md">
                    <img
                      src={formData.thumbnailUrl}
                      alt="Thumbnail"
                      className="w-full h-48 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, thumbnailUrl: '' })}
                      className="absolute top-2 right-2 p-1 bg-white rounded-lg shadow-md hover:bg-slate-100"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <ImageIcon className="w-12 h-12 text-slate-300 mb-3" />
                    <p className="text-sm text-slate-500 mb-2">
                      Nhập URL ảnh thumbnail
                    </p>
                  </>
                )}
                <input
                  type="url"
                  placeholder="https://example.com/image.jpg"
                  value={formData.thumbnailUrl}
                  onChange={(e) => setFormData({ ...formData, thumbnailUrl: e.target.value })}
                  className="mt-3 w-full max-w-md px-4 py-2 rounded-lg border border-slate-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 outline-none text-sm"
                />
              </div>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Tên khoá học <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="VD: Lập trình Java từ cơ bản đến nâng cao"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 outline-none transition-all"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Mô tả <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Mô tả chi tiết về khoá học..."
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 outline-none transition-all resize-none"
            />
          </div>

          {/* Category & Status */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Danh mục
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 outline-none transition-all bg-white"
              >
                <option value="">Chọn danh mục</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Trạng thái
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as CourseStatus })}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 outline-none transition-all bg-white"
              >
                {statusOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
              Huỷ
            </Button>
            <Button type="submit" isLoading={loading} className="flex-1">
              {editCourse ? 'Lưu thay đổi' : 'Tạo khoá học'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
