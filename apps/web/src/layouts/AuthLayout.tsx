import { Outlet } from 'react-router-dom';
import { GraduationCap, Sparkles, BookOpen, ClipboardList, Bot } from 'lucide-react';

export default function AuthLayout() {
  return (
    <div className="min-h-screen flex">
      {/* Left Column - Branding Panel (50% width on desktop) */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-violet-600 via-brand-600 to-cyan-500">
        {/* Background pattern */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyIi8+PC9nPjwvZz48L3N2Zz4=')] opacity-30"></div>

        {/* Decorative blur elements */}
        <div className="absolute top-1/4 -left-20 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-cyan-300/20 rounded-full blur-3xl"></div>

        {/* Centered branding content */}
        <div className="relative z-10 flex flex-col justify-center items-center w-full p-12 text-white">
          <div className="w-24 h-24 rounded-3xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-2xl mb-8">
            <GraduationCap className="w-12 h-12" />
          </div>
          <h1 className="text-6xl font-bold mb-4 text-center">
            SageLMS
          </h1>
          <p className="text-xl text-center text-white/80 max-w-md mb-8">
            Nền tảng học tập thông minh với AI Tutor
          </p>

          {/* Feature list */}
          <div className="space-y-4 text-left">
            <div className="flex items-center gap-3 text-white/80">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                <BookOpen className="w-5 h-5" />
              </div>
              <span>Quản lý khoá học chuyên nghiệp</span>
            </div>
            <div className="flex items-center gap-3 text-white/80">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                <ClipboardList className="w-5 h-5" />
              </div>
              <span>Quiz & Bài kiểm tra tự động</span>
            </div>
            <div className="flex items-center gap-3 text-white/80">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                <Bot className="w-5 h-5" />
              </div>
              <span>AI Tutor hỗ trợ học tập 24/7</span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm text-white/60 mt-8">
            <Sparkles className="w-4 h-4" />
            <span>Học tập thông minh - Phát triển tương lai</span>
          </div>
        </div>
      </div>

      {/* Right Column - Form (50% width on desktop, full on mobile) */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
