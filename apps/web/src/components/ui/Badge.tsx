import type { ReactNode } from 'react';

type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'default' | 'brand' | 'neutral';

interface BadgeProps {
  variant?: BadgeVariant;
  children: ReactNode;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  success:  'bg-emerald-50 text-emerald-700 border border-emerald-200/60',
  warning:  'bg-amber-50 text-amber-700 border border-amber-200/60',
  error:    'bg-rose-50 text-rose-700 border border-rose-200/60',
  info:     'bg-sky-50 text-sky-700 border border-sky-200/60',
  brand:    'bg-violet-50 text-violet-700 border border-violet-200/60',
  neutral:  'bg-slate-50 text-slate-600 border border-slate-200/60',
  default:  'bg-slate-50 text-slate-600 border border-slate-200/60',
};

export default function Badge({ variant = 'default', children, className = '' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold ${variantClasses[variant]} ${className}`}>
      {children}
    </span>
  );
}
