import * as React from 'react';
import { cn } from '@/lib/utils';

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number; // 0 to 100
  indicatorColor?: string;
}

export function Progress({ value, className, indicatorColor = 'bg-blue-600', ...props }: ProgressProps) {
  const percentage = Math.min(100, Math.max(0, value || 0));

  return (
    <div
      className={cn('relative h-2.5 w-full overflow-hidden rounded-full bg-slate-100', className)}
      {...props}
    >
      <div
        className={cn('h-full transition-all duration-500 ease-in-out', indicatorColor)}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}
