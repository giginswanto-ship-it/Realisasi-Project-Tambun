'use client';

import * as React from 'react';
import { AlertCircle, CheckCircle, RefreshCw, X, XCircle } from 'lucide-react';
import { formatRupiah } from '@/lib/utils';
import { Button } from '../ui/button';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (decision: 'APPROVED' | 'REJECTED' | 'REVISION_REQUESTED', comment: string) => Promise<void>;
  request: {
    requestNumber: string;
    title: string;
    totalAmountRequested: number;
    currentStatus: string;
    requesterName?: string;
  } | null;
  stageName: string;
}

export function ApprovalActionModal({ isOpen, onClose, onConfirm, request, stageName }: Props) {
  const [decision, setDecision] = React.useState<'APPROVED' | 'REJECTED' | 'REVISION_REQUESTED'>('APPROVED');
  const [comment, setComment] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  if (!isOpen || !request) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await onConfirm(decision, comment);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Gagal memproses keputusan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b pb-3">
          <div>
            <h2 className="text-base font-bold text-slate-900">Keputusan Persetujuan: {stageName}</h2>
            <p className="text-xs text-slate-500">Tiket: {request.requestNumber}</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mt-3 flex items-center gap-2 rounded-lg bg-rose-50 p-2.5 text-xs text-rose-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs space-y-1">
          <div className="flex justify-between">
            <span className="text-slate-500">Judul Kasbon:</span>
            <span className="font-semibold text-slate-800">{request.title}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Total Nilai:</span>
            <span className="font-bold text-slate-900">{formatRupiah(request.totalAmountRequested)}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700">Pilih Keputusan</label>
            <div className="mt-2 grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setDecision('APPROVED')}
                className={`flex flex-col items-center justify-center rounded-xl border p-3 text-xs font-medium transition-all ${
                  decision === 'APPROVED'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-800 font-bold'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <CheckCircle className="mb-1 h-5 w-5 text-emerald-600" />
                Setujui (Approve)
              </button>

              <button
                type="button"
                onClick={() => setDecision('REVISION_REQUESTED')}
                className={`flex flex-col items-center justify-center rounded-xl border p-3 text-xs font-medium transition-all ${
                  decision === 'REVISION_REQUESTED'
                    ? 'border-amber-500 bg-amber-50 text-amber-800 font-bold'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <RefreshCw className="mb-1 h-5 w-5 text-amber-600" />
                Minta Revisi
              </button>

              <button
                type="button"
                onClick={() => setDecision('REJECTED')}
                className={`flex flex-col items-center justify-center rounded-xl border p-3 text-xs font-medium transition-all ${
                  decision === 'REJECTED'
                    ? 'border-rose-500 bg-rose-50 text-rose-800 font-bold'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <XCircle className="mb-1 h-5 w-5 text-rose-600" />
                Tolak (Reject)
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">Catatan / Komentar Keputusan</label>
            <textarea
              rows={3}
              placeholder="Berikan alasan atau instruksi revisi..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-xs focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 border-t pt-3">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
              Batal
            </Button>
            <Button
              type="submit"
              size="sm"
              variant={decision === 'APPROVED' ? 'success' : decision === 'REJECTED' ? 'danger' : 'primary'}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Memproses...' : 'Konfirmasi Keputusan'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
