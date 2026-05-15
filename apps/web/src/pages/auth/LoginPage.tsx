import { Button } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import type { FormEvent } from 'react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, GraduationCap } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login({ email, password });
      navigate('/dashboard');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Đăng nhập thất bại. Vui lòng thử lại.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full animate-fade-up">
      {/* Mobile logo (visible only on small screens) */}
      <div className="lg:hidden flex flex-col items-center justify-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-xl bg-violet-600 flex items-center justify-center shadow-sm">
          <GraduationCap className="w-6 h-6 text-white" />
        </div>
        <span className="text-2xl font-bold text-violet-700">
          SageLMS
        </span>
      </div>

      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-slate-900 mb-2">Đăng nhập</h2>
        <p className="text-slate-500">Chào mừng trở lại! Nhập tài khoản để tiếp tục.</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Error message */}
        {error && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-100 text-sm text-rose-600 flex items-center gap-2">
            <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        )}

        {/* Email field */}
        <div className="space-y-2">
          <label htmlFor="email" className="block text-sm font-medium text-slate-700">
            Email
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 text-slate-400" />
            </div>
            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
              className="block w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder-slate-400 focus:border-violet-400 focus:ring-2 focus:ring-violet-100 outline-none transition-all"
            />
          </div>
        </div>

        {/* Password field */}
        <div className="space-y-2">
          <label htmlFor="password" className="block text-sm font-medium text-slate-700">
            Mật khẩu
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-slate-400" />
            </div>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="block w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder-slate-400 focus:border-violet-400 focus:ring-2 focus:ring-violet-100 outline-none transition-all"
            />
          </div>
        </div>

        {/* Remember me & Forgot password */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
            />
            <span className="text-sm text-slate-600">Ghi nhớ đăng nhập</span>
          </label>
          <a href="#" className="text-sm font-medium text-violet-600 hover:text-violet-700">
            Quên mật khẩu?
          </a>
        </div>

        {/* Submit button */}
        <Button
          type="submit"
          className="w-full py-3.5 text-base font-medium shadow-[0_8px_20px_-6px_rgba(124,58,237,0.5)] transition-shadow hover:shadow-[0_10px_24px_-6px_rgba(124,58,237,0.6)]"
          isLoading={isLoading}
        >
          Đăng nhập
        </Button>
      </form>

      {/* Register link */}
      <p className="text-center text-sm text-slate-500 mt-8">
        Chưa có tài khoản?{' '}
        <Link to="/register" className="font-semibold text-violet-600 hover:text-violet-700 transition-colors">
          Đăng ký ngay
        </Link>
      </p>
    </div>
  );
}
