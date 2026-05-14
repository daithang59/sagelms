import { useCallback, useEffect, useMemo, useState, type CSSProperties, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import {
  Archive,
  BookOpen,
  ExternalLink,
  Filter,
  RefreshCw,
  RotateCcw,
  Search,
  SearchX,
  Users,
} from 'lucide-react';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { useToast } from '@/components/Toast';
import api from '@/lib/axios';
import type { Course, CourseListResponse, CourseRequest, CourseStatus } from '@/types/course';

const statusOptions: Array<{ value: '' | CourseStatus; label: string }> = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'PUBLISHED', label: 'Đã xuất bản' },
  { value: 'DRAFT', label: 'Bản nháp' },
  { value: 'ARCHIVED', label: 'Đã lưu trữ' },
];

const categoryOptions = [
  { value: '', label: 'Tất cả lĩnh vực' },
  { value: 'Business', label: 'Business' },
  { value: 'Data', label: 'Data' },
  { value: 'Design', label: 'Design' },
  { value: 'Marketing', label: 'Marketing' },
  { value: 'Security', label: 'Security' },
  { value: 'Technology', label: 'Technology' },
];

const statusMeta: Record<CourseStatus, { label: string; variant: 'success' | 'warning' | 'neutral' }> = {
  PUBLISHED: { label: 'Đã xuất bản', variant: 'success' },
  DRAFT: { label: 'Bản nháp', variant: 'warning' },
  ARCHIVED: { label: 'Đã lưu trữ', variant: 'neutral' },
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(value));
}

function buildCourseRequest(course: Course, status: CourseStatus): CourseRequest {
  return {
    title: course.title,
    description: course.description,
    thumbnailUrl: course.thumbnailUrl || undefined,
    category: course.category || undefined,
    status,
    enrollmentPolicy: course.enrollmentPolicy,
  };
}

function StatusBadge({ status }: { status: CourseStatus }) {
  const meta = statusMeta[status];
  return <Badge variant={meta.variant}>{meta.label}</Badge>;
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: typeof BookOpen;
  label: string;
  value: number | string;
  hint: string;
}) {
  return (
    <Card hover>
      <CardBody className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-50 text-violet-600">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
          <p className="mt-1 text-xs text-slate-400">{hint}</p>
        </div>
      </CardBody>
    </Card>
  );
}

export default function AdminCoursesPage() {
  const { showToast } = useToast();
  const [courses, setCourses] = useState<Course[]>([]);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'' | CourseStatus>('');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actingCourseId, setActingCourseId] = useState<string | null>(null);

  const loadCourses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(page - 1),
        size: '20',
      });

      if (search.trim()) {
        params.set('search', search.trim());
      } else {
        if (status) params.set('status', status);
        if (category) params.set('category', category);
      }

      const response = await api.get<CourseListResponse>(`/courses?${params.toString()}`);
      setCourses(response.data.content);
      setTotalPages(Math.max(response.data.totalPages || 1, 1));
      setTotalElements(response.data.totalElements || response.data.content.length);
    } catch (err) {
      console.error('Failed to load admin courses', err);
      setError('Không tải được danh sách khóa học. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  }, [category, page, search, status]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadCourses();
  }, [loadCourses]);

  const summary = useMemo(() => {
    const published = courses.filter((course) => course.status === 'PUBLISHED').length;
    const draft = courses.filter((course) => course.status === 'DRAFT').length;
    const archived = courses.filter((course) => course.status === 'ARCHIVED').length;
    const enrollments = courses.reduce((sum, course) => sum + course.enrollmentCount, 0);

    return { published, draft, archived, enrollments };
  }, [courses]);

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPage(1);
    setSearch(searchInput);
  };

  const updateCourseStatus = async (course: Course, nextStatus: CourseStatus) => {
    const actionLabel = nextStatus === 'ARCHIVED' ? 'lưu trữ' : 'khôi phục';
    const ok = window.confirm(
      nextStatus === 'ARCHIVED'
        ? `Bạn có chắc muốn lưu trữ khóa "${course.title}"? Học viên sẽ không thể tìm thấy khóa này trong danh sách công khai.`
        : `Khôi phục khóa "${course.title}" về bản nháp? Giảng viên cần xuất bản lại nếu muốn mở ghi danh.`,
    );

    if (!ok) return;

    setActingCourseId(course.id);
    try {
      const response = await api.put<Course>(`/courses/${course.id}`, buildCourseRequest(course, nextStatus));
      setCourses((items) => items.map((item) => (item.id === course.id ? response.data : item)));
      showToast(`Đã ${actionLabel} khóa học.`, 'success');
    } catch (err) {
      console.error('Failed to update course status', err);
      showToast(`Không thể ${actionLabel} khóa học.`, 'error');
    } finally {
      setActingCourseId(null);
    }
  };

  return (
    <div className="mx-auto max-w-[1500px] space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-violet-100 bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700">
            <BookOpen className="h-3.5 w-3.5" />
            Admin course operations
          </div>
          <h1 className="text-3xl font-bold text-slate-900">Quản trị khóa học</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-500">
            Theo dõi toàn bộ khóa học trong hệ thống, xử lý khóa vi phạm và hỗ trợ giảng viên khi cần.
          </p>
        </div>
        <Button variant="outline" onClick={() => void loadCourses()} isLoading={loading}>
          <RefreshCw className="h-4 w-4" />
          Tải lại
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard icon={BookOpen} label="Đang hiển thị" value={courses.length} hint={`${totalElements} khóa theo bộ lọc`} />
        <SummaryCard icon={ExternalLink} label="Đã xuất bản" value={summary.published} hint="Khóa đang mở công khai" />
        <SummaryCard icon={Archive} label="Bản nháp / lưu trữ" value={summary.draft + summary.archived} hint="Cần admin hoặc giảng viên xử lý" />
        <SummaryCard icon={Users} label="Lượt ghi danh" value={summary.enrollments} hint="Tính trên trang hiện tại" />
      </div>

      <Card>
        <CardBody className="space-y-4">
          <form className="grid gap-3 lg:grid-cols-[1fr_200px_200px_auto]" onSubmit={handleSearch}>
            <label className="relative block">
              <span className="sr-only">Tìm kiếm khóa học</span>
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Tìm theo tên khóa học..."
                className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-sm text-slate-700 outline-none transition focus:border-violet-300 focus:ring-4 focus:ring-violet-100"
              />
            </label>
            <label>
              <span className="sr-only">Lọc trạng thái</span>
              <select
                value={status}
                onChange={(event) => {
                  setStatus(event.target.value as '' | CourseStatus);
                  setPage(1);
                }}
                disabled={Boolean(search)}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-violet-300 focus:ring-4 focus:ring-violet-100 disabled:bg-slate-50 disabled:text-slate-400"
              >
                {statusOptions.map((option) => (
                  <option key={option.value || 'all'} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className="sr-only">Lọc lĩnh vực</span>
              <select
                value={category}
                onChange={(event) => {
                  setCategory(event.target.value);
                  setPage(1);
                }}
                disabled={Boolean(search)}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-violet-300 focus:ring-4 focus:ring-violet-100 disabled:bg-slate-50 disabled:text-slate-400"
              >
                {categoryOptions.map((option) => (
                  <option key={option.value || 'all'} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <Button type="submit">
              <Filter className="h-4 w-4" />
              Áp dụng
            </Button>
          </form>
          {search && (
            <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
              <span>
                Đang tìm: <strong className="text-slate-700">{search}</strong>
              </span>
              <button
                type="button"
                className="font-semibold text-violet-600 hover:text-violet-700"
                onClick={() => {
                  setSearch('');
                  setSearchInput('');
                  setPage(1);
                }}
              >
                Xóa tìm kiếm
              </button>
              <span className="text-xs text-amber-600">Bộ lọc trạng thái/lĩnh vực tạm khóa khi đang tìm kiếm.</span>
            </div>
          )}
        </CardBody>
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-slate-50/70">
              <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="px-6 py-4">Khóa học</th>
                <th className="px-6 py-4">Giảng viên</th>
                <th className="px-6 py-4">Trạng thái</th>
                <th className="px-6 py-4">Lĩnh vực</th>
                <th className="px-6 py-4">Ghi danh</th>
                <th className="px-6 py-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white/60">
              {loading &&
                Array.from({ length: 6 }).map((_, index) => (
                  <tr key={`loading-${index}`}>
                    <td className="px-6 py-4" colSpan={6}>
                      <div className="skeleton h-12 rounded-xl" />
                    </td>
                  </tr>
                ))}

              {!loading &&
                courses.map((course, index) => (
                  <tr
                    key={course.id}
                    className="stagger-enter hover:bg-violet-50/30"
                    style={{ '--stagger-delay': `${Math.min(index * 35, 350)}ms` } as CSSProperties}
                  >
                    <td className="px-6 py-4">
                      <div className="max-w-md">
                        <Link to={`/courses/${course.id}`} className="font-semibold text-slate-900 hover:text-violet-700">
                          {course.title}
                        </Link>
                        <p className="mt-1 line-clamp-2 text-sm text-slate-500">{course.description}</p>
                        <p className="mt-1 text-xs text-slate-400">Cập nhật {formatDate(course.updatedAt)}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <p className="font-semibold text-slate-800">{course.instructorFullName || 'Chưa rõ'}</p>
                        <p className="text-slate-500">{course.instructorEmail || 'Không có email'}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={course.status} />
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{course.category || 'Chưa phân loại'}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-slate-800">{course.enrollmentCount}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/courses/${course.id}`}
                          className="pressable inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700"
                          title="Mở chi tiết"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Link>
                        {course.status === 'ARCHIVED' ? (
                          <Button
                            variant="outline"
                            size="sm"
                            isLoading={actingCourseId === course.id}
                            onClick={() => void updateCourseStatus(course, 'DRAFT')}
                          >
                            <RotateCcw className="h-4 w-4" />
                            Khôi phục
                          </Button>
                        ) : (
                          <Button
                            variant="danger"
                            size="sm"
                            isLoading={actingCourseId === course.id}
                            onClick={() => void updateCourseStatus(course, 'ARCHIVED')}
                          >
                            <Archive className="h-4 w-4" />
                            Lưu trữ
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}

              {!loading && courses.length === 0 && (
                <tr>
                  <td className="px-6 py-16 text-center" colSpan={6}>
                    <div className="mx-auto flex max-w-sm flex-col items-center">
                      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                        <SearchX className="h-6 w-6" />
                      </div>
                      <p className="font-semibold text-slate-800">Không có khóa học phù hợp</p>
                      <p className="mt-1 text-sm text-slate-500">Thử đổi từ khóa, trạng thái hoặc lĩnh vực.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-100 px-6 py-4 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <span>
            Trang {page} / {totalPages} · {totalElements} khóa học
          </span>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" disabled={page <= 1 || loading} onClick={() => setPage((value) => Math.max(value - 1, 1))}>
              Trước
            </Button>
            <Button variant="secondary" size="sm" disabled={page >= totalPages || loading} onClick={() => setPage((value) => Math.min(value + 1, totalPages))}>
              Sau
            </Button>
          </div>
        </div>
      </Card>

      {error && (
        <div className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          {error}
        </div>
      )}
    </div>
  );
}
