import { Card, CardBody, Button } from '@/components/ui';
import { Bot, MessageSquare, Sparkles } from 'lucide-react';

export default function AiTutorPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-lg">
          <Bot className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-surface-900">AI Tutor</h1>
          <p className="text-surface-500">Hỏi đáp thông minh với tài liệu khoá học.</p>
        </div>
      </div>

      {/* AI Tutor Chat Placeholder */}
      <Card className="overflow-hidden">
        <CardBody className="p-0">
          <div className="p-16 text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center">
              <Sparkles className="w-10 h-10 text-orange-500" />
            </div>
            <h3 className="text-lg font-semibold text-surface-700 mb-2">AI Tutor Chat</h3>
            <p className="text-surface-500 max-w-md mx-auto mb-6">
              Giao diện chat AI Tutor sẽ được xây dựng ở đây. Kết nối với{' '}
              <code className="px-2 py-0.5 rounded-md bg-surface-100 text-brand-600 text-sm">ai-tutor-service</code> API
              để gửi câu hỏi và nhận câu trả lời kèm citation.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button className="gap-2">
                <MessageSquare className="w-4 h-4" />
                Bắt đầu chat
              </Button>
              <Button variant="secondary" className="gap-2">
                <Sparkles className="w-4 h-4" />
                Tìm hiểu thêm
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
