import * as React from 'react';
import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  Coins,
  CreditCard,
  PieChart,
  Wallet,
} from 'lucide-react';
import { formatPercent, formatRupiah } from '@/lib/utils';
import { Card } from '../ui/card';
import { Progress } from '../ui/progress';

export interface DashboardSummaryData {
  totalProjects: number;
  grandContractValue: number;
  grandBudget: number;
  grandCommitted: number;
  grandRealized: number;
  grandRemainingBudget: number;
  burnRatePercent: number;
  committedPercent: number;
  totalExpenseRequests: number;
  totalRealizations: number;
  overrunCount: number;
}

export function ExecutiveKpiCards({ summary }: { summary: DashboardSummaryData }) {
  const isHealthy = summary.grandRemainingBudget > 0 && summary.overrunCount === 0;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* 1. Total Pagu Proyek */}
      <Card className="border-l-4 border-l-slate-900">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
            Total Pagu Anggaran
          </span>
          <div className="rounded-lg bg-slate-100 p-2 text-slate-700">
            <Wallet className="h-5 w-5" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-bold tracking-tight text-slate-900">
            {formatRupiah(summary.grandBudget)}
          </div>
          <div className="mt-1 flex items-center text-xs text-slate-500">
            <span>Nilai Kontrak: {formatRupiah(summary.grandContractValue)}</span>
          </div>
        </div>
      </Card>

      {/* 2. Dana Kasbon Dicairkan */}
      <Card className="border-l-4 border-l-blue-600">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
            Kas Bon Dicairkan
          </span>
          <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
            <Coins className="h-5 w-5" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-bold tracking-tight text-slate-900">
            {formatRupiah(summary.grandCommitted)}
          </div>
          <div className="mt-2 space-y-1">
            <div className="flex justify-between text-xs text-slate-500">
              <span>Rasio Komitmen</span>
              <span className="font-semibold text-slate-700">{formatPercent(summary.committedPercent)}</span>
            </div>
            <Progress value={summary.committedPercent} indicatorColor="bg-blue-600" />
          </div>
        </div>
      </Card>

      {/* 3. Realisasi Belanja Sah (LPJ) */}
      <Card className="border-l-4 border-l-emerald-600">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
            Realisasi Belanja Sah (LPJ)
          </span>
          <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-bold tracking-tight text-slate-900">
            {formatRupiah(summary.grandRealized)}
          </div>
          <div className="mt-2 space-y-1">
            <div className="flex justify-between text-xs text-slate-500">
              <span>Burn Rate Realisasi</span>
              <span className="font-semibold text-slate-700">{formatPercent(summary.burnRatePercent)}</span>
            </div>
            <Progress value={summary.burnRatePercent} indicatorColor="bg-emerald-600" />
          </div>
        </div>
      </Card>

      {/* 4. Sisa Pagu Anggaran Tersedia */}
      <Card
        className={`border-l-4 ${
          isHealthy ? 'border-l-purple-600' : 'border-l-rose-600'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
            Sisa Pagu Tersedia
          </span>
          <div
            className={`rounded-lg p-2 ${
              isHealthy ? 'bg-purple-50 text-purple-600' : 'bg-rose-50 text-rose-600'
            }`}
          >
            {isHealthy ? <PieChart className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
          </div>
        </div>
        <div className="mt-3">
          <div
            className={`text-2xl font-bold tracking-tight ${
              isHealthy ? 'text-slate-900' : 'text-rose-600'
            }`}
          >
            {formatRupiah(summary.grandRemainingBudget)}
          </div>
          <div className="mt-1 flex items-center justify-between text-xs">
            {summary.overrunCount > 0 ? (
              <span className="inline-flex items-center text-rose-600 font-semibold">
                <AlertTriangle className="mr-1 h-3.5 w-3.5" />
                {summary.overrunCount} Item Over-Budget
              </span>
            ) : (
              <span className="text-emerald-600 font-medium">Status Pagu Sehat</span>
            )}
            <span className="text-slate-400">{summary.totalExpenseRequests} Tiket Kasbon</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
