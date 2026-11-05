import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'outline' | 'purple';
}

export function Badge({ className, variant = 'default', children, ...props }: BadgeProps) {
  const variantStyles = {
    default: 'bg-slate-100 text-slate-800 border-slate-200',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    danger: 'bg-rose-50 text-rose-700 border-rose-200',
    info: 'bg-blue-50 text-blue-700 border-blue-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
    outline: 'border-slate-300 text-slate-700 bg-transparent',
  };

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors',
        variantStyles[variant],
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'DIEVALUASI':
    case 'VERIFIED_FINANCE':
      return <Badge variant="warning">Dievaluasi</Badge>;
    case 'DISETUJUI':
      return <Badge variant="info">Disetujui</Badge>;
    case 'SUDAH_DIBAYAR':
      return <Badge variant="success">Sudah Dibayar</Badge>;
    case 'SETTLED':
    case 'COMPLETED':
      return <Badge variant="success">Selesai / Ditutup</Badge>;
    case 'DISBURSED':
      return <Badge variant="info">Dana Dicairkan</Badge>;
    case 'APPROVED_FINANCE':
      return <Badge variant="purple">Disetujui Finance</Badge>;
    case 'APPROVED_DIRECTOR':
      return <Badge variant="purple">Disetujui Direksi</Badge>;
    case 'APPROVED_PM':
      return <Badge variant="info">Disetujui PM</Badge>;
    case 'SUBMITTED':
      return <Badge variant="warning">Menunggu Review</Badge>;
    case 'DRAFT':
      return <Badge variant="outline">Draft Baru</Badge>;
    case 'REJECTED':
      return <Badge variant="danger">Ditolak</Badge>;
    case 'REVISION_REQUESTED':
      return <Badge variant="warning">Perlu Revisi</Badge>;
    case 'OVERRUN':
      return <Badge variant="danger">Budget Overrun</Badge>;
    default:
      return <Badge variant="default">{status}</Badge>;
  }
}
