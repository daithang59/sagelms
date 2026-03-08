import { Button } from '@/components/ui';
import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="text-center space-y-6 max-w-md">
        <p className="text-8xl">🔍</p>
        <h1 className="text-4xl font-bold text-gray-900">404</h1>
        <p className="text-gray-500">
          Trang bạn tìm kiếm không tồn tại hoặc đã bị di chuyển.
        </p>
        <Link to="/dashboard">
          <Button variant="primary" size="lg">
            Về trang chủ
          </Button>
        </Link>
      </div>
    </div>
  );
}
