import { useAuth } from '@/contexts/AuthContext';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  ClipboardList,
  Bot,
  Users,
  ChevronLeft,
  LogOut,
  GraduationCap,
} from 'lucide-react';

const navigation = [
  {
    name: 'Dashboard',
    path: '/dashboard',
    icon: LayoutDashboard,
    roles: ['ADMIN', 'INSTRUCTOR', 'STUDENT'],
  },
  {
    name: 'Khoá học',
    path: '/courses',
    icon: BookOpen,
    roles: ['ADMIN', 'INSTRUCTOR', 'STUDENT'],
  },
  {
    name: 'Bài kiểm tra',
    path: '/quizzes',
    icon: ClipboardList,
    roles: ['ADMIN', 'INSTRUCTOR', 'STUDENT'],
  },
  {
    name: 'AI Tutor',
    path: '/ai-tutor',
    icon: Bot,
    roles: ['ADMIN', 'INSTRUCTOR', 'STUDENT'],
  },
  {
    name: 'Quản lý Users',
    path: '/admin/users',
    icon: Users,
    roles: ['ADMIN'],
  },
];

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

export default function Sidebar({ isCollapsed, onToggle }: SidebarProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const filteredNav = navigation.filter(
    (item) => !user?.role || item.roles.includes(user.role),
  );

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside
      className={`
        fixed left-0 top-0 z-40 h-screen bg-white border-r border-surface-200
        transition-all duration-300 flex flex-col shadow-xl
        ${isCollapsed ? 'w-20' : 'w-64'}
      `}
    >
      {/* Logo */}
      <div className="h-20 flex items-center gap-3 px-4 border-b border-surface-100">
        <div className="w-10 h-10 rounded-xl bg-gradient-brand flex items-center justify-center shadow-glow-brand">
          <GraduationCap className="w-6 h-6 text-white" />
        </div>
        {!isCollapsed && (
          <div className="flex flex-col">
            <span className="text-lg font-bold bg-gradient-brand bg-clip-text text-transparent">
              SageLMS
            </span>
            <span className="text-xs text-surface-400">Learning Platform</span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
        {filteredNav.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group
              ${isActive
                ? 'bg-brand-50 text-brand-700 shadow-sm'
                : 'text-surface-600 hover:bg-surface-50 hover:text-surface-900'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <item.icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-brand-600' : 'text-surface-400 group-hover:text-surface-600'}`} />
                {!isCollapsed && <span>{item.name}</span>}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-surface-100 p-3 space-y-1">
        <button
          onClick={onToggle}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-surface-500 hover:bg-surface-50 hover:text-surface-700 transition-colors"
        >
          <ChevronLeft className={`w-5 h-5 transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`} />
          {!isCollapsed && <span>Thu gọn</span>}
        </button>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-red-500 hover:bg-red-50 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          {!isCollapsed && <span>Đăng xuất</span>}
        </button>
      </div>
    </aside>
  );
}
