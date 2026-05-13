import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, ChevronDown, Loader2, LogOut, Settings, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import type { AppNotification, UnreadCountResponse } from '@/types/auth';
import { AnimatePresence, motion } from 'framer-motion';

export default function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);
  const headerActionsRef = useRef<HTMLDivElement>(null);

  const roleLabel = {
    ADMIN: 'Quản trị viên',
    INSTRUCTOR: 'Giảng viên',
    STUDENT: 'Học viên',
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (headerActionsRef.current && !headerActionsRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
        setIsNotificationOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadNotifications = useCallback(async () => {
    if (!user) return;
    setIsLoadingNotifications(true);
    try {
      const [items, count] = await Promise.all([
        api.get<AppNotification[]>('/notifications?limit=10'),
        api.get<UnreadCountResponse>('/notifications/unread-count'),
      ]);
      setNotifications(items);
      setUnreadCount(count.unreadCount);
    } catch {
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setIsLoadingNotifications(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      void Promise.resolve().then(loadNotifications);
    }
  }, [loadNotifications, user]);

  const handleLogout = () => {
    logout();
    setIsDropdownOpen(false);
    setIsNotificationOpen(false);
    navigate('/login');
  };

  const goTo = (path: string) => {
    setIsDropdownOpen(false);
    setIsNotificationOpen(false);
    navigate(path);
  };

  const toggleNotifications = () => {
    setIsNotificationOpen((open) => !open);
    setIsDropdownOpen(false);
    if (!isNotificationOpen) {
      void loadNotifications();
    }
  };

  const handleNotificationClick = async (notification: AppNotification) => {
    try {
      if (!notification.read) {
        await api.patch<AppNotification>(`/notifications/${notification.id}/read`);
        setUnreadCount((count) => Math.max(0, count - 1));
        setNotifications((items) =>
          items.map((item) => (item.id === notification.id ? { ...item, read: true } : item)),
        );
      }
    } finally {
      setIsNotificationOpen(false);
      if (notification.targetUrl?.startsWith('/')) {
        navigate(notification.targetUrl);
      }
    }
  };

  const markAllRead = async () => {
    await api.patch<void>('/notifications/read-all');
    setUnreadCount(0);
    setNotifications((items) => items.map((item) => ({ ...item, read: true })));
  };

  return (
    <header className="fixed top-0 right-0 left-0 h-20 bg-white/80 backdrop-blur-lg border-b border-surface-200 flex items-center justify-between px-8 z-50">
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-semibold text-surface-800">SageLMS</h2>
      </div>

      <div ref={headerActionsRef} className="flex items-center gap-4">
        {user && (
          <div className="relative">
            <button
              type="button"
              onClick={toggleNotifications}
              className="relative p-3 rounded-xl text-surface-400 hover:text-surface-600 hover:bg-surface-50 transition-colors"
              aria-label="Thông báo"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute right-1.5 top-1.5 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            <AnimatePresence>
              {isNotificationOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -5 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -5 }}
                  transition={{ duration: 0.15, ease: 'easeOut' }}
                  className="absolute right-0 mt-2 w-[360px] max-w-[calc(100vw-2rem)] origin-top-right overflow-hidden rounded-2xl border border-surface-100 bg-white shadow-xl z-[100]"
                >
                  <div className="flex items-center justify-between border-b border-surface-100 px-4 py-3">
                    <div>
                      <p className="text-sm font-semibold text-surface-900">Thông báo</p>
                      <p className="text-xs text-surface-500">{unreadCount} thông báo chưa đọc</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => void markAllRead()}
                      disabled={unreadCount === 0}
                      className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-violet-600 hover:bg-violet-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <CheckCheck className="h-3.5 w-3.5" />
                      Đã đọc
                    </button>
                  </div>

                  <div className="max-h-[420px] overflow-y-auto py-1">
                    {isLoadingNotifications ? (
                      <div className="flex items-center justify-center gap-2 px-4 py-10 text-sm text-surface-500">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Đang tải thông báo...
                      </div>
                    ) : notifications.length === 0 ? (
                      <div className="px-4 py-10 text-center">
                        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                          <Bell className="h-6 w-6" />
                        </div>
                        <p className="text-sm font-medium text-surface-800">Chưa có thông báo</p>
                        <p className="mt-1 text-xs text-surface-500">Các cập nhật ghi danh sẽ xuất hiện tại đây.</p>
                      </div>
                    ) : (
                      notifications.map((notification) => (
                        <button
                          key={notification.id}
                          type="button"
                          onClick={() => void handleNotificationClick(notification)}
                          className="flex w-full gap-3 px-4 py-3 text-left transition hover:bg-surface-50"
                        >
                          <span
                            className={`mt-1 h-2.5 w-2.5 flex-none rounded-full ${
                              notification.read ? 'bg-slate-200' : 'bg-violet-500'
                            }`}
                          />
                          <span className="min-w-0 flex-1">
                            <span className="block text-sm font-semibold text-surface-900">{notification.title}</span>
                            {notification.message && (
                              <span className="mt-0.5 line-clamp-2 block text-xs leading-5 text-surface-500">
                                {notification.message}
                              </span>
                            )}
                            <span className="mt-1 block text-[11px] font-medium text-surface-400">
                              {formatRelativeTime(notification.createdAt)}
                            </span>
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {user && (
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setIsDropdownOpen(!isDropdownOpen);
                setIsNotificationOpen(false);
              }}
              className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-surface-50 transition-colors"
            >
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt="" className="h-10 w-10 rounded-xl object-cover shadow-md" />
              ) : (
                <div className="w-10 h-10 rounded-xl bg-gradient-brand flex items-center justify-center shadow-md">
                  <span className="text-sm font-bold text-white">
                    {user.fullName?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                </div>
              )}
              <div className="hidden sm:block text-left">
                <p className="text-sm font-medium text-surface-800">{user.fullName}</p>
                <p className="text-xs text-surface-500">{roleLabel[user.role] || user.role}</p>
              </div>
              <ChevronDown className={`w-4 h-4 text-surface-400 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {isDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -5 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -5 }}
                  transition={{ duration: 0.15, ease: 'easeOut' }}
                  className="absolute right-0 mt-2 w-56 origin-top-right bg-white rounded-2xl shadow-xl border border-surface-100 py-2 z-[100]"
                >
                  <div className="px-4 py-3 border-b border-surface-100">
                    <p className="text-sm font-medium text-surface-800">{user.fullName}</p>
                    <p className="text-xs text-surface-500">{user.email}</p>
                  </div>
                  <div className="py-1">
                    <button
                      type="button"
                      onClick={() => goTo('/profile')}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-surface-600 hover:bg-surface-50 transition-colors"
                    >
                      <User className="w-4 h-4" />
                      Hồ sơ cá nhân
                    </button>
                    <button
                      type="button"
                      onClick={() => goTo('/settings')}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-surface-600 hover:bg-surface-50 transition-colors"
                    >
                      <Settings className="w-4 h-4" />
                      Cài đặt
                    </button>
                  </div>
                  <div className="border-t border-surface-100 py-1">
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Đăng xuất
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </header>
  );
}

function formatRelativeTime(value: string) {
  const createdAt = new Date(value).getTime();
  if (Number.isNaN(createdAt)) return '';
  const diffSeconds = Math.max(0, Math.floor((Date.now() - createdAt) / 1000));
  if (diffSeconds < 60) return 'Vừa xong';
  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `${diffMinutes} phút trước`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} giờ trước`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays} ngày trước`;
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium' }).format(new Date(value));
}
