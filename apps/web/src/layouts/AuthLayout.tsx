import { Outlet } from 'react-router-dom';
import {
  GraduationCap,
  Sparkles,
  BookOpen,
  ClipboardList,
  Bot,
} from 'lucide-react';
import type { ReactNode } from 'react';

export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-slate-50 lg:grid lg:h-screen lg:grid-cols-[minmax(0,1.1fr)_minmax(420px,0.9fr)] lg:overflow-hidden">
      {/* Left Panel: Abstract Brand/Product Preview */}
      <section className="relative hidden overflow-hidden lg:flex flex-col items-center justify-center p-12">
        {/* Animated Mesh Gradient Background */}
        <div className="absolute inset-0 bg-slate-950 overflow-hidden">
           <div className="absolute -top-[20%] -left-[10%] w-[70%] h-[70%] bg-violet-600/30 rounded-full blur-[120px] mix-blend-screen animate-blob" />
           <div className="absolute top-[20%] -right-[10%] w-[60%] h-[60%] bg-sky-500/20 rounded-full blur-[120px] mix-blend-screen animate-blob" style={{ animationDelay: '2s' }} />
           <div className="absolute -bottom-[20%] left-[20%] w-[80%] h-[80%] bg-fuchsia-600/20 rounded-full blur-[120px] mix-blend-screen animate-blob" style={{ animationDelay: '4s' }} />
           {/* Subtle Grid Pattern */}
           <div className="absolute inset-0 opacity-[0.05] [background-image:linear-gradient(rgba(255,255,255,.8)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.8)_1px,transparent_1px)] [background-size:40px_40px]" />
        </div>

        <div className="relative z-10 w-full max-w-2xl text-center">
          {/* Logo & Headline */}
          <div className="mb-10 flex flex-col items-center gap-6 animate-fade-up">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 text-white backdrop-blur-md shadow-2xl shadow-black/20 ring-1 ring-white/20">
              <GraduationCap className="h-8 w-8" />
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-violet-200 backdrop-blur-md">
              <Sparkles className="h-4 w-4 text-violet-300" />
              Nền tảng học tập thông minh
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold leading-tight tracking-tight text-white">
              Học tập, giảng dạy <br/> và quản trị tập trung.
            </h1>
            <p className="max-w-lg mx-auto text-lg leading-relaxed text-slate-300">
              Mọi công cụ bạn cần để theo dõi khóa học, bài học và thử thách đều nằm gọn trong một không gian tối giản, hiệu quả.
            </p>
          </div>

          {/* Abstract Floating Benefit Chips (Minimalist) */}
          <div className="mt-12 flex flex-wrap justify-center gap-4 animate-fade-up" style={{ animationDelay: '200ms' }}>
             <FeaturePill icon={<BookOpen className="h-5 w-5" />} label="Quản lý Khóa học" floatDelay="0s" />
             <FeaturePill icon={<ClipboardList className="h-5 w-5" />} label="Thử thách tương tác" floatDelay="0.5s" />
             <FeaturePill icon={<Bot className="h-5 w-5" />} label="AI Tutor 24/7" floatDelay="1s" />
          </div>
        </div>
      </section>

      {/* Right Panel: Form Area */}
      <main className="relative flex min-h-screen items-center justify-center overflow-y-auto px-5 py-8 sm:px-8 bg-slate-50 lg:min-h-0 lg:px-12 filter-scrollbar">
        {/* Very soft border/shadow instead of heavy drop shadow */}
        <div className="relative z-10 w-full max-w-[28rem] rounded-3xl border border-slate-200/60 bg-white p-8 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.04)] lg:max-h-[calc(100vh-4rem)] lg:overflow-y-auto filter-scrollbar animate-fade-up">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

function FeaturePill({ icon, label, floatDelay = '0s' }: { icon: ReactNode; label: string; floatDelay?: string }) {
  return (
    <div 
      className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium text-white/90 backdrop-blur-md animate-float"
      style={{ animationDelay: floatDelay }}
    >
      <div className="text-violet-300">{icon}</div>
      {label}
    </div>
  );
}