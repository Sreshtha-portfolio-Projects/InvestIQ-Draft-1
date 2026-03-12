import { cn } from '@/utils/cn';

interface CardProps {
  className?: string;
  children: React.ReactNode;
  hover?: boolean;
}

export const Card = ({ className, children, hover = false }: CardProps) => {
  return (
    <div
      className={cn(
        'bg-slate-900 border border-slate-800 rounded-xl p-5',
        hover && 'hover:border-slate-600 transition-colors cursor-pointer',
        className
      )}
    >
      {children}
    </div>
  );
};

export const CardHeader = ({ className, children }: { className?: string; children: React.ReactNode }) => (
  <div className={cn('flex items-center justify-between mb-4', className)}>{children}</div>
);

export const CardTitle = ({ className, children }: { className?: string; children: React.ReactNode }) => (
  <h3 className={cn('text-sm font-semibold text-slate-400 uppercase tracking-wider', className)}>
    {children}
  </h3>
);
