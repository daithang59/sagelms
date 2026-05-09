import { Card, CardBody } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import {
  BookOpen,
  ClipboardList,
  TrendingUp,
  Bot,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

const stats = [
  {
    label: 'Khoá học',
    value: '—',
    icon: BookOpen,
    gradient: 'from-violet-500 to-purple-600',
    bgColor: 'bg-violet-50',
    iconColor: 'text-violet-600',
  },
  {
    label: 'Bài kiểm tra',
    value: '—',
    icon: ClipboardList,
    gradient: 'from-cyan-500 to-blue-600',
    bgColor: 'bg-cyan-50',
    iconColor: 'text-cyan-600',
  },
  {
    label: 'Tiến trình',
    value: '—',
    icon: TrendingUp,
    gradient: 'from-emerald-500 to-teal-600',
    bgColor: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
  },
  {
    label: 'AI Tutor',
    value: '—',
    icon: Bot,
    gradient: 'from-orange-500 to-amber-600',
    bgColor: 'bg-orange-50',
    iconColor: 'text-orange-600',
  },
];

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-8 animate-in">
      {/* Welcome */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-600 via-brand-600 to-cyan-500 p-8 text-white shadow-xl">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-5 h-5 text-yellow-300" />
            <span className="text-violet-100 text-sm font-medium">Chào mừng trở lại</span>
          </div>
          <h1 className="text-3xl font-bold mb-2">
            Xin chào, {user?.fullName || 'bạn'}!
          </h1>
          <p className="text-violet-100 max-w-xl">
            Chào mừng trở lại SageLMS. Đây là tổng quan hoạt động của bạn.
          </p>
        </div>
        <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} hover className="relative overflow-hidden">
            <CardBody className="flex items-center gap-4 relative z-10">
              <div className={`w-14 h-14 rounded-2xl ${stat.bgColor} flex items-center justify-center shadow-lg`}>
                <stat.icon className={`w-7 h-7 ${stat.iconColor}`} />
              </div>
              <div>
                <p className="text-3xl font-bold text-surface-900">{stat.value}</p>
                <p className="text-sm text-surface-500">{stat.label}</p>
              </div>
            </CardBody>
            <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 hover:opacity-5 transition-opacity duration-300`}></div>
          </Card>
        ))}
      </div>

      {/* Placeholder sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="overflow-hidden">
          <CardBody className="p-0">
            <div className="p-6 border-b border-surface-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-violet-600" />
                </div>
                <h3 className="text-lg font-semibold text-surface-800">Khoá học gần đây</h3>
              </div>
            </div>
            <div className="p-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-surface-100 flex items-center justify-center">
                <BookOpen className="w-8 h-8 text-surface-300" />
              </div>
              <p className="text-surface-500 mb-4">Chưa có khoá học nào</p>
              <button className="inline-flex items-center gap-2 text-sm font-medium text-brand-600 hover:text-brand-700 transition-colors">
                Bắt đầu ngay <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </CardBody>
        </Card>

        <Card className="overflow-hidden">
          <CardBody className="p-0">
            <div className="p-6 border-b border-surface-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-100 flex items-center justify-center">
                  <ClipboardList className="w-5 h-5 text-cyan-600" />
                </div>
                <h3 className="text-lg font-semibold text-surface-800">Bài kiểm tra sắp tới</h3>
              </div>
            </div>
            <div className="p-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-surface-100 flex items-center justify-center">
                <ClipboardList className="w-8 h-8 text-surface-300" />
              </div>
              <p className="text-surface-500 mb-4">Chưa có bài kiểm tra nào</p>
              <button className="inline-flex items-center gap-2 text-sm font-medium text-cyan-600 hover:text-cyan-700 transition-colors">
                Xem lịch sử <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
