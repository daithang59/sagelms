import Badge from '@/components/ui/Badge';
import { useAuth } from '@/contexts/AuthContext';

export default function Header() {
  const { user } = useAuth();

  const roleBadgeVariant = {
    ADMIN: 'error' as const,
    INSTRUCTOR: 'info' as const,
    STUDENT: 'success' as const,
  };

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      {/* Left — Page title placeholder */}
      <div>
        <h2 className="text-lg font-semibold text-gray-800">SageLMS</h2>
      </div>

      {/* Right — User info */}
      <div className="flex items-center gap-4">
        {/* Notifications placeholder */}
        <button className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        </button>

        {/* User info */}
        {user && (
          <div className="flex items-center gap-3">
            <Badge variant={roleBadgeVariant[user.role]}>
              {user.role}
            </Badge>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                <span className="text-sm font-medium text-primary-700">
                  {user.fullName?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              </div>
              <span className="text-sm font-medium text-gray-700 hidden sm:block">
                {user.fullName}
              </span>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
