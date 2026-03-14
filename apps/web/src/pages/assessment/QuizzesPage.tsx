import { Card, CardBody, Button } from '@/components/ui';
import { ClipboardList, Plus, Search } from 'lucide-react';

export default function QuizzesPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Bài kiểm tra</h1>
          <p className="mt-1 text-surface-500">Tạo và làm bài kiểm tra trắc nghiệm.</p>
        </div>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Tạo bài kiểm tra
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardBody className="p-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
            <input
              type="text"
              placeholder="Tìm kiếm bài kiểm tra..."
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-surface-200 bg-surface-50 text-surface-900 placeholder-surface-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 focus:outline-none transition-all duration-200"
            />
          </div>
        </CardBody>
      </Card>

      {/* Quiz List Placeholder */}
      <Card className="overflow-hidden">
        <CardBody className="p-0">
          <div className="p-16 text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-cyan-100 to-blue-100 flex items-center justify-center">
              <ClipboardList className="w-10 h-10 text-cyan-600" />
            </div>
            <h3 className="text-lg font-semibold text-surface-700 mb-2">Danh sách bài kiểm tra</h3>
            <p className="text-surface-500 max-w-md mx-auto mb-6">
              Trang này sẽ hiển thị danh sách quiz. Kết nối với{' '}
              <code className="px-2 py-0.5 rounded-md bg-surface-100 text-brand-600 text-sm">assessment-service</code> API
              để tạo quiz, làm bài, và xem kết quả.
            </p>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Tạo bài kiểm tra đầu tiên
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
