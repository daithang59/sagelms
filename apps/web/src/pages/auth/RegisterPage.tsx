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
  'block w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100 placeholder-slate-400 text-slate-900';
const inputWithIconClasses =
  'block w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100 placeholder-slate-400 text-slate-900';

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
    if (mode === 'instructor' && bio.trim().length < 50) {
      return 'Bio giảng dạy cần ít nhất 50 ký tự để admin có đủ thông tin đánh giá.';
    }
    return '';
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
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
    <div className="w-full animate-fade-up">
      <MobileLogo />

      <div className="mb-8 text-center">
        <h2 className="mb-2 text-3xl font-bold text-slate-900">Tạo tài khoản</h2>
        <p className="text-slate-500">
          Học viên có thể vào học ngay. Giáo viên cần phê duyệt.
        </p>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1 shadow-inner">
        <button
          type="button"
          onClick={() => setMode('student')}
          className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold transition ${
            mode === 'student' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <GraduationCap className="h-4 w-4" />
          Học viên
        </button>
        <button
          type="button"
          onClick={() => setMode('instructor')}
          className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold transition ${
            mode === 'instructor' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <BriefcaseBusiness className="h-4 w-4" />
          Giáo viên
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="rounded-xl border border-rose-100 bg-rose-50 p-4 text-sm text-rose-600">
            {error}
          </div>
        )}

        <Field id="register-full-name" label="Họ và tên" icon={<User className="h-5 w-5" />}>
          <input
            id="register-full-name"
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            required
            autoFocus
            placeholder="Nguyễn Văn A"
            className={inputWithIconClasses}
          />
        </Field>

        <Field id="register-email" label="Email" icon={<Mail className="h-5 w-5" />}>
          <input
            id="register-email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            type="email"
            placeholder="you@example.com"
            className={inputWithIconClasses}
          />
        </Field>

        {mode === 'instructor' && (
          <div className="grid grid-cols-1 gap-5">
            <Field id="instructor-headline" label="Chức danh giới thiệu">
              <input
                id="instructor-headline"
                value={headline}
                onChange={(event) => setHeadline(event.target.value)}
                required
                placeholder="Senior Backend Engineer, Java Instructor"
                className={inputClasses}
              />
            </Field>
            <Field id="instructor-expertise" label="Chuyên môn">
              <input
                id="instructor-expertise"
                value={expertise}
                onChange={(event) => setExpertise(event.target.value)}
                required
                placeholder="Java, Spring Boot, Microservices"
                className={inputClasses}
              />
            </Field>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field id="instructor-years" label="Số năm kinh nghiệm">
                <input
                  id="instructor-years"
                  value={yearsExperience}
                  onChange={(event) => setYearsExperience(event.target.value)}
                  min={0}
                  max={60}
                  type="number"
                  placeholder="5"
                  className={inputClasses}
                />
              </Field>
              <Field id="instructor-website" label="Website/LinkedIn">
                <input
                  id="instructor-website"
                  value={website}
                  onChange={(event) => setWebsite(event.target.value)}
                  placeholder="https://..."
                  className={inputClasses}
                />
              </Field>
            </div>
            <TextArea
              id="instructor-bio"
              label="Bio giảng dạy"
              value={bio}
              onChange={setBio}
              required
              minLength={50}
              placeholder="Tóm tắt kinh nghiệm, phong cách giảng dạy, các chủ đề có thể dạy và đối tượng học viên phù hợp."
            />
            <TextArea
              id="instructor-note"
              label="Ghi chú cho admin"
              value={applicationNote}
              onChange={setApplicationNote}
              placeholder="Link portfolio, chứng chỉ, khóa học đã dạy hoặc thông tin admin nên biết."
            />
          </div>
        )}

        <Field id="register-password" label="Mật khẩu" icon={<Lock className="h-5 w-5" />}>
          <input
            id="register-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            type="password"
            placeholder="Tối thiểu 8 ký tự"
            className={inputWithIconClasses}
          />
        </Field>

        <Field id="register-confirm-password" label="Xác nhận mật khẩu" icon={<Lock className="h-5 w-5" />}>
          <input
            id="register-confirm-password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            required
            type="password"
            placeholder="Nhập lại mật khẩu"
            className={inputWithIconClasses}
          />
        </Field>

        <div className="rounded-xl border border-violet-100 bg-violet-50 px-4 py-3 text-sm text-violet-700">
          {mode === 'student'
            ? 'Tài khoản học viên sẽ được tạo và đăng nhập ngay.'
            : 'Tài khoản giáo viên chỉ đăng nhập được sau khi admin phê duyệt hồ sơ.'}
        </div>

        <Button type="submit" className="w-full py-3.5 text-base font-medium shadow-[0_8px_20px_-6px_rgba(124,58,237,0.5)] transition-shadow hover:shadow-[0_10px_24px_-6px_rgba(124,58,237,0.6)]" isLoading={isLoading}>
          {mode === 'student' ? 'Đăng ký học viên' : 'Gửi hồ sơ giáo viên'}
        </Button>
      </form>

      <p className="mb-12 mt-8 text-center text-sm text-slate-500 lg:mb-16">
        Đã có tài khoản?{' '}
        <Link to="/login" className="font-semibold text-violet-600 transition-colors hover:text-violet-700">
          Đăng nhập
        </Link>
      </p>
    </div>
  );
}

function MobileLogo() {
  return (
    <div className="mb-8 flex flex-col items-center justify-center gap-3 lg:hidden">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-600 shadow-sm">
        <GraduationCap className="h-6 w-6 text-white" />
      </div>
      <span className="text-2xl font-bold text-violet-700">
        SageLMS
      </span>
    </div>
  );
}

function InstructorApplicationSubmitted({ email }: { email: string }) {
  return (
    <div className="w-full animate-fade-up">
      <MobileLogo />

      <div className="text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-emerald-50 text-emerald-600 border border-emerald-100">
          <CheckCircle2 className="h-10 w-10" />
        </div>
        <h2 className="text-3xl font-bold text-slate-900">Hồ sơ đã được gửi</h2>
        <p className="mt-3 text-slate-500">
          Chúng tôi đã nhận hồ sơ giáo viên của <span className="font-medium text-slate-700">{email}</span>.
          Tài khoản sẽ đăng nhập được sau khi admin phê duyệt.
        </p>
      </div>

      <div className="mt-8 space-y-4 rounded-2xl border border-slate-200 bg-white shadow-sm p-5">
        <Step
          icon={<MailCheck className="h-5 w-5" />}
          title="Hồ sơ đang chờ duyệt"
          description="Admin sẽ kiểm tra chuyên môn, bio và thông tin liên hệ của bạn."
        />
        <Step
          icon={<Clock3 className="h-5 w-5" />}
          title="Thời gian phản hồi"
          description="Thông thường hồ sơ được xử lý trong 24-48 giờ làm việc."
        />
        <Step
          icon={<CheckCircle2 className="h-5 w-5" />}
          title="Sau khi được duyệt"
          description="Bạn có thể đăng nhập và bắt đầu tạo khóa học trên SageLMS."
        />
      </div>

      <Link
        to="/login"
        className="mt-8 inline-flex w-full items-center justify-center rounded-xl bg-violet-600 px-5 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-violet-700 active:scale-95"
      >
        Về trang đăng nhập
      </Link>
    </div>
  );
}

function Step({ icon, title, description }: { icon: ReactNode; title: string; description: string }) {
  return (
    <div className="flex gap-4">
      <div className="mt-0.5 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-slate-50 text-violet-600 border border-slate-100">
        {icon}
      </div>
      <div>
        <div className="text-sm font-semibold text-slate-900">{title}</div>
        <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
      </div>
    </div>
  );
}

function Field({ id, label, icon, children }: { id: string; label: string; icon?: ReactNode; children: ReactNode }) {
  return (
    <div className="block space-y-2">
      <label htmlFor={id} className="block text-sm font-medium text-slate-700">
        {label}
      </label>
      <span className="relative block">
        {icon && <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">{icon}</span>}
        {children}
      </span>
    </div>
  );
}

function TextArea({
  id,
  label,
  value,
  onChange,
  placeholder,
  required = false,
  minLength,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  minLength?: number;
}) {
  return (
    <div className="block space-y-2">
      <label htmlFor={id} className="block text-sm font-medium text-slate-700">
        {label}
      </label>
      <textarea
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        minLength={minLength}
        rows={4}
        placeholder={placeholder}
        className="block w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100 placeholder-slate-400 text-slate-900"
      />
    </div>
  );
}
