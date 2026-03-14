import { Button } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import type { UserRole } from '@/types/auth';
import type { FormEvent } from 'react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, GraduationCap, UserPlus } from 'lucide-react';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<UserRole>('STUDENT');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp.');
      return;
    }
    if (password.length < 8) {
      setError('Mật khẩu phải có ít nhất 8 ký tự.');
      return;
    }

    setIsLoading(true);
    try {
      await register({ email, password, fullName, role });
      navigate('/dashboard');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Đăng ký thất bại. Vui lòng thử lại.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      {/* Mobile logo (visible only on small screens) */}
      <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-2xl bg-gradient-brand flex items-center justify-center shadow-lg">
          <GraduationCap className="w-6 h-6 text-white" />
        </div>
        <span className="text-2xl font-bold bg-gradient-brand bg-clip-text text-transparent">
          SageLMS
        </span>
      </div>

      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Tạo tài khoản</h2>
        <p className="text-gray-500">Đăng ký để bắt đầu hành trình học tập.</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Error message */}
        {error && (
          <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600 flex items-center gap-2">
            <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        )}

        {/* Full Name field */}
        <div className="space-y-2">
          <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
            Họ và tên
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <User className="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="fullName"
              type="text"
              placeholder="Nguyễn Văn A"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              autoFocus
              className="block w-full pl-12 pr-4 py-3 rounded-lg border border-gray-300 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-colors"
            />
          </div>
        </div>

        {/* Email field */}
        <div className="space-y-2">
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="block w-full pl-12 pr-4 py-3 rounded-lg border border-gray-300 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-colors"
            />
          </div>
        </div>

        {/* Password field */}
        <div className="space-y-2">
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            Mật khẩu
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="password"
              type="password"
              placeholder="Tối thiểu 8 ký tự"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="block w-full pl-12 pr-4 py-3 rounded-lg border border-gray-300 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-colors"
            />
          </div>
        </div>

        {/* Confirm Password field */}
        <div className="space-y-2">
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
            Xác nhận mật khẩu
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="confirmPassword"
              type="password"
              placeholder="Nhập lại mật khẩu"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="block w-full pl-12 pr-4 py-3 rounded-lg border border-gray-300 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-colors"
            />
          </div>
        </div>

        {/* Role selector */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Vai trò</label>
          <div className="flex justify-between gap-4">
            <button
              type="button"
              onClick={() => setRole('STUDENT')}
              className={`flex-1 flex items-center justify-center gap-2 p-4 rounded-lg border-2 transition-all duration-200 ${
                role === 'STUDENT'
                  ? 'border-violet-600 bg-violet-50 text-violet-700'
                  : 'border-gray-200 hover:border-gray-300 text-gray-600'
              }`}
            >
              <User className="w-5 h-5" />
              <span className="font-medium">Học viên</span>
            </button>
            <button
              type="button"
              onClick={() => setRole('INSTRUCTOR')}
              className={`flex-1 flex items-center justify-center gap-2 p-4 rounded-lg border-2 transition-all duration-200 ${
                role === 'INSTRUCTOR'
                  ? 'border-violet-600 bg-violet-50 text-violet-700'
                  : 'border-gray-200 hover:border-gray-300 text-gray-600'
              }`}
            >
              <UserPlus className="w-5 h-5" />
              <span className="font-medium">Giảng viên</span>
            </button>
          </div>
        </div>

        {/* Submit button */}
        <Button
          type="submit"
          className="w-full py-3.5 text-base font-medium bg-gradient-to-r from-violet-600 to-violet-700 hover:from-violet-700 hover:to-violet-800"
          isLoading={isLoading}
        >
          Đăng ký
        </Button>
      </form>

      {/* Login link */}
      <p className="text-center text-sm text-gray-500 mt-8">
        Đã có tài khoản?{' '}
        <Link to="/login" className="font-semibold text-violet-600 hover:text-violet-700 transition-colors">
          Đăng nhập
        </Link>
      </p>
    </div>
  );
}
