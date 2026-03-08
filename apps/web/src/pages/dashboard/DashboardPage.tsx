import { Card, CardBody } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';

const stats = [
  { label: 'Khoá học', value: '—', icon: '📚', color: 'bg-blue-50 text-blue-600' },
  { label: 'Bài kiểm tra', value: '—', icon: '✏️', color: 'bg-green-50 text-green-600' },
  { label: 'Tiến trình', value: '—', icon: '📈', color: 'bg-purple-50 text-purple-600' },
  { label: 'AI Tutor', value: '—', icon: '🤖', color: 'bg-orange-50 text-orange-600' },
];

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Xin chào, {user?.fullName || 'bạn'} 👋
        </h1>
        <p className="mt-1 text-gray-500">
          Chào mừng trở lại SageLMS. Đây là tổng quan hoạt động của bạn.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardBody className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${stat.color}`}>
                {stat.icon}
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-sm text-gray-500">{stat.label}</p>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      {/* Placeholder sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardBody>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">📚 Khoá học gần đây</h3>
            <div className="text-center py-8 text-gray-400">
              <p className="text-4xl mb-2">📭</p>
              <p>Chưa có khoá học nào — bắt đầu tạo hoặc đăng ký!</p>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">✏️ Bài kiểm tra sắp tới</h3>
            <div className="text-center py-8 text-gray-400">
              <p className="text-4xl mb-2">📝</p>
              <p>Chưa có bài kiểm tra — sẽ hiển thị khi có quiz mới.</p>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
