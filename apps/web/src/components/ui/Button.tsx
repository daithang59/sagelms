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
  primary:   'bg-gradient-brand text-white shadow-soft hover:shadow-glow-brand focus-visible:ring-brand-500',
  secondary: 'bg-surface-100 text-surface-700 hover:bg-surface-200 focus-visible:ring-surface-400',
  outline:   'border-2 border-brand-200 text-brand-600 hover:bg-brand-50 hover:border-brand-300 focus-visible:ring-brand-500',
  ghost:     'text-surface-600 hover:bg-surface-100 hover:text-surface-900 focus-visible:ring-surface-400',
  danger:    'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-soft hover:shadow-lg hover:from-red-600 hover:to-red-700 focus-visible:ring-red-500',
};

const sizeClasses: Record<Size, string> = {
  sm: 'px-3 py-2 text-sm',
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
      className={`btn ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
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
