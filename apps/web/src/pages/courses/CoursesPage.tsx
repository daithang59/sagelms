import { Card, CardBody } from '@/components/ui';

export default function CoursesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">📚 Khoá học</h1>
          <p className="mt-1 text-gray-500">Quản lý và khám phá các khoá học.</p>
        </div>
        {/* TODO: Add "Create Course" button for INSTRUCTOR/ADMIN */}
      </div>

      <Card>
        <CardBody>
          <div className="text-center py-16 text-gray-400">
            <p className="text-6xl mb-4">📚</p>
            <h3 className="text-lg font-medium text-gray-600 mb-2">Course Listing — Coming Soon</h3>
            <p className="text-sm max-w-md mx-auto">
              Trang này sẽ hiển thị danh sách khoá học. Kết nối với <code className="text-primary-600">course-service</code> API
              để lấy và hiển thị dữ liệu.
            </p>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
