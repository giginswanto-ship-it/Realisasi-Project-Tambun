import * as React from 'react';
import { formatPercent, formatRupiah } from '@/lib/utils';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Progress } from '../ui/progress';

export interface CategorySummary {
  categoryCode: string;
  name: string;
  allocatedAmount: number;
  committedAmount: number;
  realizedAmount: number;
  usagePercent: number;
}

interface BudgetVarianceProps {
  categories: CategorySummary[];
}

export function BudgetVarianceChart({ categories }: BudgetVarianceProps) {
  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Distribusi & Serapan per Kategori Budget</CardTitle>
            <p className="text-xs text-slate-500 mt-0.5">Proyek Fasilitas Pergudangan Tambun</p>
          </div>
          <Badge variant="info">6 Kategori Budget</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {categories.map((cat, idx) => {
            const isNearLimit = cat.usagePercent > 80;
            const isExceeded = cat.usagePercent > 100;

            const progressColor = isExceeded
              ? 'bg-rose-600'
              : isNearLimit
              ? 'bg-amber-500'
              : 'bg-emerald-600';

            const remaining = cat.allocatedAmount - (cat.realizedAmount + cat.committedAmount);

            return (
              <div key={cat.categoryCode || idx} className="space-y-1.5 rounded-lg border border-slate-100 p-3 bg-slate-50/50">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{idx + 1}.</span>
                    <span className="text-slate-800 font-semibold">{cat.name}</span>
                  </div>
                  <div className="text-right">
                    <span className={`font-bold ${isExceeded ? 'text-rose-600' : 'text-slate-900'}`}>
                      {formatRupiah(cat.realizedAmount + cat.committedAmount)}
                    </span>
                    <span className="text-slate-400"> / {formatRupiah(cat.allocatedAmount)}</span>
                  </div>
                </div>

                <Progress value={cat.usagePercent} indicatorColor={progressColor} className="h-2" />

                <div className="flex justify-between text-[11px] text-slate-500 pt-0.5">
                  <span>Pemakaian Sah: {formatRupiah(cat.realizedAmount)}</span>
                  <span>Kasbon Aktif: {formatRupiah(cat.committedAmount)}</span>
                  <span className="text-slate-600">Sisa Pagu: <b className="text-slate-900">{formatRupiah(remaining)}</b></span>
                  <span className={`font-semibold ${isExceeded ? 'text-rose-600' : 'text-slate-700'}`}>
                    Terserap {formatPercent(cat.usagePercent)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
