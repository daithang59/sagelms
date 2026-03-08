import { Card, CardBody } from '@/components/ui';

export default function AiTutorPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">🤖 AI Tutor</h1>
        <p className="mt-1 text-gray-500">Hỏi đáp thông minh với tài liệu khoá học.</p>
      </div>

      <Card>
        <CardBody>
          <div className="text-center py-16 text-gray-400">
            <p className="text-6xl mb-4">🤖</p>
            <h3 className="text-lg font-medium text-gray-600 mb-2">AI Tutor Chat — Coming Soon</h3>
            <p className="text-sm max-w-md mx-auto">
              Giao diện chat AI Tutor sẽ được xây dựng ở đây. Kết nối với{' '}
              <code className="text-primary-600">ai-tutor-service</code> API
              để gửi câu hỏi và nhận câu trả lời kèm citation.
            </p>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
