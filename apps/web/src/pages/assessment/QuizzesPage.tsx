import { Card, CardBody } from '@/components/ui';

export default function QuizzesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">✏️ Bài kiểm tra</h1>
        <p className="mt-1 text-gray-500">Tạo và làm bài kiểm tra trắc nghiệm.</p>
      </div>

      <Card>
        <CardBody>
          <div className="text-center py-16 text-gray-400">
            <p className="text-6xl mb-4">✏️</p>
            <h3 className="text-lg font-medium text-gray-600 mb-2">Quizzes — Coming Soon</h3>
            <p className="text-sm max-w-md mx-auto">
              Trang này sẽ hiển thị danh sách quiz. Kết nối với <code className="text-primary-600">assessment-service</code> API
              để tạo quiz, làm bài, và xem kết quả.
            </p>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
