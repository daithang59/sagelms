import { Button } from '@/components/ui';
import { Link } from 'react-router-dom';
import { Home, SearchX } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-50 p-6">
      <div className="text-center space-y-6 max-w-md">
        <div className="w-24 h-24 mx-auto rounded-3xl bg-gradient-to-br from-surface-100 to-surface-200 flex items-center justify-center">
          <SearchX className="w-12 h-12 text-surface-400" />
        </div>
        <h1 className="text-6xl font-bold bg-gradient-brand bg-clip-text text-transparent">404</h1>
        <p className="text-surface-500 text-lg">
          Trang bạn tìm kiếm không tồn tại hoặc đã bị di chuyển.
        </p>
        <Link to="/dashboard">
          <Button className="gap-2">
            <Home className="w-4 h-4" />
            Về trang chủ
          </Button>
        </Link>
      </div>
    </div>
  );
}
