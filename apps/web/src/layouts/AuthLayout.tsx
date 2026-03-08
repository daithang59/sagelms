import { Outlet } from 'react-router-dom';

export default function AuthLayout() {
  return (
    <div className="min-h-screen flex">
      {/* Left — Branding panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 items-center justify-center p-12">
        <div className="text-center space-y-6 max-w-md">
          <div className="text-6xl">📚</div>
          <h1 className="text-4xl font-bold text-white">SageLMS</h1>
          <p className="text-lg text-primary-100">
            Nền tảng học tập trực tuyến tích hợp AI Tutor thông minh
          </p>
          <div className="flex gap-4 justify-center text-primary-200 text-sm">
            <span>✓ Quản lý khoá học</span>
            <span>✓ Quiz tự động</span>
            <span>✓ AI Tutor</span>
          </div>
        </div>
      </div>

      {/* Right — Auth form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 bg-gray-50">
        <div className="w-full max-w-md">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
