import { Card, CardBody, Button } from '@/components/ui';
import { BookOpen, Plus, Search, Filter } from 'lucide-react';

export default function CoursesPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Khoá học</h1>
          <p className="mt-1 text-surface-500">Quản lý và khám phá các khoá học.</p>
        </div>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Tạo khoá học
        </Button>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardBody className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
              <input
                type="text"
                placeholder="Tìm kiếm khoá học..."
                className="w-full pl-12 pr-4 py-3 rounded-xl border border-surface-200 bg-surface-50 text-surface-900 placeholder-surface-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 focus:outline-none transition-all duration-200"
              />
            </div>
            <Button variant="secondary" className="gap-2">
              <Filter className="w-4 h-4" />
              Lọc
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Course List Placeholder */}
      <Card className="overflow-hidden">
        <CardBody className="p-0">
          <div className="p-16 text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-violet-100 to-brand-100 flex items-center justify-center">
              <BookOpen className="w-10 h-10 text-brand-500" />
            </div>
            <h3 className="text-lg font-semibold text-surface-700 mb-2">Danh sách khoá học</h3>
            <p className="text-surface-500 max-w-md mx-auto mb-6">
              Trang này sẽ hiển thị danh sách khoá học. Kết nối với{' '}
              <code className="px-2 py-0.5 rounded-md bg-surface-100 text-brand-600 text-sm">course-service</code> API
              để lấy và hiển thị dữ liệu.
            </p>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Tạo khoá học đầu tiên
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
