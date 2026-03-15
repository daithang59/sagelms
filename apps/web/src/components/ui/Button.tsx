import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  isLoading?: boolean;
  children: ReactNode;
}

const variantClasses: Record<Variant, string> = {
  primary:   'bg-gradient-brand text-white shadow-lg shadow-violet-500/25 hover:shadow-xl hover:shadow-violet-500/30 focus-visible:ring-violet-500',
  secondary: 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 focus-visible:ring-slate-400',
  outline:   'border-2 border-violet-200 text-violet-600 hover:bg-violet-50 hover:border-violet-300 focus-visible:ring-violet-500',
  ghost:     'text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus-visible:ring-slate-400',
  danger:    'bg-gradient-to-r from-rose-500 to-red-500 text-white shadow-lg shadow-rose-500/25 hover:shadow-xl hover:from-rose-600 hover:to-red-600 focus-visible:ring-rose-500',
};

const sizeClasses: Record<Size, string> = {
  sm: 'px-3.5 py-2 text-sm',
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-6 py-3 text-base',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  children,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 font-medium rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <Loader2 className="h-4 w-4 animate-spin" />
      )}
      {children}
    </button>
  );
}
