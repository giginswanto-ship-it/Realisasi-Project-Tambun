import * as React from 'react';
import { Clock, ShieldCheck, UserCheck } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

export interface AuditLogItem {
  id: string;
  action: string;
  entityName: string;
  entityId: string;
  user?: {
    id: string;
    fullName: string;
    email: string;
  };
  newValues?: any;
  createdAt: string;
}

export function RecentActivityFeed({ logs }: { logs: AuditLogItem[] }) {
  const getActionBadge = (action: string) => {
    switch (action) {
      case 'CREATE':
        return <Badge variant="outline">Buat Draft</Badge>;
      case 'SUBMIT':
        return <Badge variant="warning">Diajukan</Badge>;
      case 'APPROVE':
        return <Badge variant="info">Disetujui</Badge>;
      case 'DISBURSE':
        return <Badge variant="purple">Pencairan</Badge>;
      case 'SETTLE':
        return <Badge variant="success">LPJ Selesai</Badge>;
      case 'REJECT':
        return <Badge variant="danger">Ditolak</Badge>;
      default:
        return <Badge variant="default">{action}</Badge>;
    }
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Jejak Audit & Aktivitas Lapangan</CardTitle>
          <span className="flex items-center text-xs text-slate-500">
            <Clock className="mr-1 h-3.5 w-3.5" /> Real-time
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="divide-y divide-slate-100">
          {logs.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">Belum ada aktivitas tercatat.</div>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="py-3 flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <div className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-700">
                    {log.user?.fullName?.charAt(0) || 'U'}
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-900">
                      {log.user?.fullName || 'Sistem'}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {log.entityName}: {log.newValues?.requestNumber || log.newValues?.realizationNumber || log.entityId.slice(0, 8)}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1">
                  {getActionBadge(log.action)}
                  <span className="text-[10px] text-slate-400">{formatDate(log.createdAt)}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
