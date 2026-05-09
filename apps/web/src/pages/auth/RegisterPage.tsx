import { Button } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import type { FormEvent, ReactNode } from 'react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  BriefcaseBusiness,
  CheckCircle2,
  Clock3,
  GraduationCap,
  Lock,
  Mail,
  MailCheck,
  User,
} from 'lucide-react';

type RegisterMode = 'student' | 'instructor';

const inputClasses =
  'block w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-400 transition-colors focus:border-transparent focus:outline-none focus:ring-2 focus:ring-violet-500';
const inputWithIconClasses =
  'block w-full rounded-lg border border-gray-300 py-3 pl-12 pr-4 text-gray-900 placeholder-gray-400 transition-colors focus:border-transparent focus:outline-none focus:ring-2 focus:ring-violet-500';

export default function RegisterPage() {
  const { register, applyInstructor } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<RegisterMode>('student');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [headline, setHeadline] = useState('');
  const [expertise, setExpertise] = useState('');
  const [yearsExperience, setYearsExperience] = useState('');
  const [website, setWebsite] = useState('');
  const [bio, setBio] = useState('');
  const [applicationNote, setApplicationNote] = useState('');
  const [submittedEmail, setSubmittedEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const validateBase = () => {
    if (password !== confirmPassword) {
      return 'Mật khẩu xác nhận không khớp.';
    }
    if (password.length < 8) {
      return 'Mật khẩu phải có ít nhất 8 ký tự.';
    }
    return '';
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    const validationError = validateBase();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);
    try {
      if (mode === 'student') {
        await register({ email, password, fullName });
        navigate('/dashboard');
        return;
      }

      await applyInstructor({
        email,
        password,
        fullName,
        headline,
        expertise,
        bio,
        website: website || undefined,
        yearsExperience: yearsExperience ? Number(yearsExperience) : undefined,
        applicationNote: applicationNote || undefined,
      });
      setSubmittedEmail(email);
      setPassword('');
      setConfirmPassword('');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Đăng ký thất bại. Vui lòng thử lại.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  if (submittedEmail) {
    return <InstructorApplicationSubmitted email={submittedEmail} />;
  }

  return (
    <div className="w-full">
      <MobileLogo />

      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Tạo tài khoản</h2>
        <p className="text-gray-500">Học viên có thể vào học ngay. Giáo viên cần admin phê duyệt hồ sơ.</p>
      </div>

      <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1 mb-6">
        <button
          type="button"
          onClick={() => setMode('student')}
          className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
            mode === 'student' ? 'bg-white text-violet-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <GraduationCap className="h-4 w-4" />
          Học viên
        </button>
        <button
          type="button"
          onClick={() => setMode('instructor')}
          className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
            mode === 'instructor' ? 'bg-white text-violet-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <BriefcaseBusiness className="h-4 w-4" />
          Giáo viên
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">
            {error}
          </div>
        )}

        <Field label="Họ và tên" icon={<User className="h-5 w-5" />}>
          <input value={fullName} onChange={(e) => setFullName(e.target.value)} required autoFocus placeholder="Nguyễn Văn A" className={inputWithIconClasses} />
        </Field>

        <Field label="Email" icon={<Mail className="h-5 w-5" />}>
          <input value={email} onChange={(e) => setEmail(e.target.value)} required type="email" placeholder="you@example.com" className={inputWithIconClasses} />
        </Field>

        {mode === 'instructor' && (
          <div className="grid grid-cols-1 gap-5">
            <Field label="Chức danh giới thiệu">
              <input value={headline} onChange={(e) => setHeadline(e.target.value)} required placeholder="Senior Backend Engineer, Java Instructor" className={inputClasses} />
            </Field>
            <Field label="Chuyên môn">
              <input value={expertise} onChange={(e) => setExpertise(e.target.value)} required placeholder="Java, Spring Boot, Microservices" className={inputClasses} />
            </Field>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Số năm kinh nghiệm">
                <input value={yearsExperience} onChange={(e) => setYearsExperience(e.target.value)} min={0} max={60} type="number" placeholder="5" className={inputClasses} />
              </Field>
              <Field label="Website/LinkedIn">
                <input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://..." className={inputClasses} />
              </Field>
            </div>
            <TextArea label="Bio giảng dạy" value={bio} onChange={setBio} required placeholder="Tóm tắt kinh nghiệm, phong cách giảng dạy, đối tượng học viên phù hợp." />
            <TextArea label="Ghi chú cho admin" value={applicationNote} onChange={setApplicationNote} placeholder="Link portfolio, chứng chỉ, khóa học đã dạy..." />
          </div>
        )}

        <Field label="Mật khẩu" icon={<Lock className="h-5 w-5" />}>
          <input value={password} onChange={(e) => setPassword(e.target.value)} required type="password" placeholder="Tối thiểu 8 ký tự" className={inputWithIconClasses} />
        </Field>

        <Field label="Xác nhận mật khẩu" icon={<Lock className="h-5 w-5" />}>
          <input value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required type="password" placeholder="Nhập lại mật khẩu" className={inputWithIconClasses} />
        </Field>

        <div className="rounded-lg border border-violet-100 bg-violet-50 px-4 py-3 text-sm text-violet-700">
          {mode === 'student'
            ? 'Tài khoản học viên sẽ được tạo và đăng nhập ngay.'
            : 'Tài khoản giáo viên chỉ đăng nhập được sau khi admin phê duyệt hồ sơ.'}
        </div>

        <Button type="submit" className="w-full py-3.5 text-base font-medium" isLoading={isLoading}>
          {mode === 'student' ? 'Đăng ký học viên' : 'Gửi hồ sơ giáo viên'}
        </Button>
      </form>

      <p className="text-center text-sm text-gray-500 mt-8 mb-12 lg:mb-16">
        Đã có tài khoản?{' '}
        <Link to="/login" className="font-semibold text-violet-600 hover:text-violet-700 transition-colors">
          Đăng nhập
        </Link>
      </p>
    </div>
  );
}

function MobileLogo() {
  return (
    <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
      <div className="w-12 h-12 rounded-2xl bg-gradient-brand flex items-center justify-center shadow-lg">
        <GraduationCap className="w-6 h-6 text-white" />
      </div>
      <span className="text-2xl font-bold bg-gradient-brand bg-clip-text text-transparent">
        SageLMS
      </span>
    </div>
  );
}

function InstructorApplicationSubmitted({ email }: { email: string }) {
  return (
    <div className="w-full">
      <MobileLogo />

      <div className="text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
          <CheckCircle2 className="h-10 w-10" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900">Hồ sơ đã được gửi</h2>
        <p className="mt-3 text-gray-500">
          Chúng tôi đã nhận hồ sơ giáo viên của <span className="font-medium text-gray-700">{email}</span>.
          Tài khoản sẽ đăng nhập được sau khi admin phê duyệt.
        </p>
      </div>

      <div className="mt-8 space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-5">
        <Step icon={<MailCheck className="h-5 w-5" />} title="Hồ sơ đang chờ duyệt" description="Admin sẽ kiểm tra chuyên môn, bio và thông tin liên hệ của bạn." />
        <Step icon={<Clock3 className="h-5 w-5" />} title="Thời gian phản hồi" description="Thông thường hồ sơ được xử lý trong 24-48 giờ làm việc." />
        <Step icon={<CheckCircle2 className="h-5 w-5" />} title="Sau khi được duyệt" description="Bạn có thể đăng nhập và bắt đầu tạo khóa học trên SageLMS." />
      </div>

      <Link
        to="/login"
        className="mt-8 inline-flex w-full items-center justify-center rounded-xl bg-gradient-brand px-5 py-3.5 text-base font-medium text-white shadow-lg shadow-violet-500/25 transition hover:shadow-xl hover:shadow-violet-500/30"
      >
        Về trang đăng nhập
      </Link>
    </div>
  );
}

function Step({ icon, title, description }: { icon: ReactNode; title: string; description: string }) {
  return (
    <div className="flex gap-3">
      <div className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-white text-violet-600 ring-1 ring-slate-200">
        {icon}
      </div>
      <div>
        <div className="text-sm font-semibold text-slate-900">{title}</div>
        <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
      </div>
    </div>
  );
}

function Field({ label, icon, children }: { label: string; icon?: ReactNode; children: ReactNode }) {
  return (
    <label className="block space-y-2">
      <span className="block text-sm font-medium text-gray-700">{label}</span>
      <span className="relative block">
        {icon && <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400">{icon}</span>}
        {children}
      </span>
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
  placeholder,
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="block space-y-2">
      <span className="block text-sm font-medium text-gray-700">{label}</span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        rows={4}
        placeholder={placeholder}
        className="block w-full resize-none rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-400 transition-colors focus:border-transparent focus:outline-none focus:ring-2 focus:ring-violet-500"
      />
    </label>
  );
}
