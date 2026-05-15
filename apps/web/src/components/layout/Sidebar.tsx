import { useAuth } from '@/contexts/AuthContext';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Bot,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  UserCog,
  Users,
} from 'lucide-react';

const navigation = [
  {
    name: 'Dashboard',
    path: '/dashboard',
    icon: LayoutDashboard,
    roles: ['ADMIN', 'INSTRUCTOR', 'STUDENT'],
  },
  {
    name: 'Khóa học',
    path: '/courses',
    icon: BookOpen,
    roles: ['ADMIN', 'INSTRUCTOR', 'STUDENT'],
  },
  {
    name: 'Thử thách',
    path: '/challenges',
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
    name: 'Quản lý user',
    path: '/admin/users',
    icon: UserCog,
    roles: ['ADMIN'],
  },
  {
    name: 'Quản trị khóa',
    path: '/admin/courses',
    icon: BookOpen,
    roles: ['ADMIN'],
  },
  {
    name: 'Duyệt giáo viên',
    path: '/admin/instructors',
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
        fixed left-0 top-0 z-40 h-screen bg-white/70 backdrop-blur-2xl border-r border-white/50
        transition-all duration-300 flex flex-col shadow-[4px_0_24px_rgba(0,0,0,0.02)] ring-1 ring-slate-100/50
        ${isCollapsed ? 'w-20' : 'w-64'}
      `}
    >
      <div className="h-16 flex items-center gap-3 px-4 border-b border-slate-100">
        <div className="w-10 h-10 rounded-xl bg-violet-600 flex items-center justify-center shadow-sm">
          <GraduationCap className="w-6 h-6 text-white" />
        </div>
        {!isCollapsed && (
          <div className="flex flex-col">
            <span className="text-lg font-bold text-violet-700">
              SageLMS
            </span>
            <span className="text-xs font-medium text-slate-400">Learning Platform</span>
          </div>
        )}
      </div>

      <nav className="flex-1 py-6 px-3 space-y-1.5 overflow-y-auto">
        {filteredNav.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group
              ${
                isActive
                  ? 'bg-gradient-to-r from-violet-50 to-indigo-50 text-violet-700 shadow-sm'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <item.icon
                  className={`w-5 h-5 flex-shrink-0 ${
                    isActive ? 'text-violet-600' : 'text-slate-400 group-hover:text-slate-600'
                  }`}
                />
                {!isCollapsed && <span>{item.name}</span>}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-slate-100 p-3 space-y-1">
        <button
          onClick={onToggle}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-all duration-200 ${
            isCollapsed ? 'justify-center' : ''
          }`}
        >
          {isCollapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <>
              <ChevronLeft className="w-5 h-5" />
              <span>Thu gọn</span>
            </>
          )}
        </button>

        <button
          onClick={handleLogout}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-all duration-200 ${
            isCollapsed ? 'justify-center' : ''
          }`}
        >
          <LogOut className="w-5 h-5" />
          {!isCollapsed && <span>Đăng xuất</span>}
        </button>
      </div>
    </aside>
  );
}
