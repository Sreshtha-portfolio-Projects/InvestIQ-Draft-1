import { cn } from '@/utils/cn';

interface BadgeProps {
  variant?: 'default' | 'success' | 'danger' | 'warning' | 'info';
  className?: string;
  children: React.ReactNode;
}

const variantStyles = {
  default: 'bg-slate-700 text-slate-300',
  success: 'bg-emerald-400/10 text-emerald-400',
  danger: 'bg-red-400/10 text-red-400',
  warning: 'bg-amber-400/10 text-amber-400',
  info: 'bg-blue-400/10 text-blue-400',
};

export const Badge = ({ variant = 'default', className, children }: BadgeProps) => {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  );
};
