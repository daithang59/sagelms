import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Bell, ChevronDown, User, Settings, LogOut } from 'lucide-react';

export default function Header() {
  const { user, logout } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const roleLabel = {
    ADMIN: 'Quản trị viên',
    INSTRUCTOR: 'Giảng viên',
    STUDENT: 'Học viên',
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    setIsDropdownOpen(false);
  };

  return (
    <header className="h-20 bg-white/80 backdrop-blur-lg border-b border-surface-200 flex items-center justify-between px-8">
      {/* Left - Page title placeholder */}
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-semibold text-surface-800">SageLMS</h2>
      </div>

      {/* Right - User info */}
      <div className="flex items-center gap-4">
        {/* Notifications */}
        <button className="relative p-3 rounded-xl text-surface-400 hover:text-surface-600 hover:bg-surface-50 transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

        {/* User dropdown */}
        {user && (
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-surface-50 transition-colors"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-brand flex items-center justify-center shadow-md">
                <span className="text-sm font-bold text-white">
                  {user.fullName?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-medium text-surface-800">{user.fullName}</p>
                <p className="text-xs text-surface-500">{roleLabel[user.role] || user.role}</p>
              </div>
              <ChevronDown className={`w-4 h-4 text-surface-400 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown menu */}
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-surface-100 py-2 z-50 animate-in">
                <div className="px-4 py-3 border-b border-surface-100">
                  <p className="text-sm font-medium text-surface-800">{user.fullName}</p>
                  <p className="text-xs text-surface-500">{user.email}</p>
                </div>
                <div className="py-1">
                  <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-surface-600 hover:bg-surface-50 transition-colors">
                    <User className="w-4 h-4" />
                    Hồ sơ cá nhân
                  </button>
                  <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-surface-600 hover:bg-surface-50 transition-colors">
                    <Settings className="w-4 h-4" />
                    Cài đặt
                  </button>
                </div>
                <div className="border-t border-surface-100 py-1">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Đăng xuất
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
