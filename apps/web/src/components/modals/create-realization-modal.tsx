'use client';

import * as React from 'react';
import { AlertCircle, CheckCircle, FileText, Plus, Trash2, UploadCloud, X } from 'lucide-react';
import { formatRupiah } from '@/lib/utils';
import { Button } from '../ui/button';

interface DisbursedRequestOption {
  id: string;
  requestNumber: string;
  title: string;
  totalAmountRequested: number;
  items: Array<{
    id: string;
    budgetItemId: string;
    description: string;
    requestedQty: number;
    estimatedUnitPrice: number;
  }>;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: any) => Promise<void>;
  disbursedRequests: DisbursedRequestOption[];
}

export function CreateRealizationModal({
  isOpen,
  onClose,
  onSubmit,
  disbursedRequests,
}: Props) {
  const [selectedRequestId, setSelectedRequestId] = React.useState<string>('');
  const [notes, setNotes] = React.useState('');
  const [items, setItems] = React.useState<
    Array<{
      budgetItemId: string;
      itemName: string;
      invoiceNumber: string;
      actualQty: number;
      actualUnitPrice: number;
      invoiceDate: string;
      fileName?: string;
    }>
  >([]);

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);

  // Auto-select first disbursed request
  React.useEffect(() => {
    if (disbursedRequests.length > 0 && !selectedRequestId) {
      setSelectedRequestId(disbursedRequests[0].id);
    }
  }, [disbursedRequests, selectedRequestId]);

  const activeRequest = disbursedRequests.find((r) => r.id === selectedRequestId);

  // Pre-fill items from the active request when selected
  React.useEffect(() => {
    if (activeRequest && items.length === 0) {
      setItems(
        activeRequest.items.map((i) => ({
          budgetItemId: i.budgetItemId,
          itemName: i.description,
          invoiceNumber: '',
          actualQty: Number(i.requestedQty),
          actualUnitPrice: Number(i.estimatedUnitPrice),
          invoiceDate: new Date().toISOString().slice(0, 10),
          fileName: 'struk_nota_lapangan.jpg',
        })),
      );
    }
  }, [activeRequest]);

  const updateItem = (index: number, field: string, val: any) => {
    setItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: val };
      return next;
    });
  };

  const totalRealized = items.reduce(
    (sum, itm) => sum + Number(itm.actualQty) * Number(itm.actualUnitPrice),
    0,
  );

  const requestedAmount = activeRequest ? Number(activeRequest.totalAmountRequested) : 0;
  const remainingBalance = requestedAmount - totalRealized;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (items.length === 0) {
      setFormError('Harap sertakan minimal 1 item nota belanja nyata.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        requestId: selectedRequestId,
        notes,
        items: items.map((i) => ({
          budgetItemId: i.budgetItemId,
          itemName: i.itemName,
          invoiceNumber: i.invoiceNumber || 'NOTA-KONTAN',
          actualQty: Number(i.actualQty),
          actualUnitPrice: Number(i.actualUnitPrice),
          invoiceDate: i.invoiceDate,
          notes: `Bukti berkas: ${i.fileName || 'Kwitansi fisik'}`,
        })),
      });
      onClose();
    } catch (err: any) {
      setFormError(err.message || 'Gagal menyimpan berkas LPJ.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b pb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Form Laporan Pertanggungjawaban (LPJ) & Kwitansi</h2>
            <p className="text-xs text-slate-500">Laporkan pembelanjaan fisik aktual dan bukti struk nota belanja kasbon.</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        {formError && (
          <div className="mt-4 flex items-center gap-2 rounded-lg bg-rose-50 p-3 text-xs text-rose-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700">Pilih Tiket Kas Bon Dicairkan</label>
              <select
                value={selectedRequestId}
                onChange={(e) => setSelectedRequestId(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-blue-500 focus:outline-none"
                required
              >
                {disbursedRequests.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.requestNumber} - {r.title} ({formatRupiah(r.totalAmountRequested)})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">Catatan LPJ Tambahan</label>
              <input
                type="text"
                placeholder="Misal: Nota asli diserahkan ke Finance kantor pusat"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Rincian Nota Belanja Lapangan */}
          <div className="border-t pt-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Rincian Nota Pembelian Aktual
            </span>

            <div className="mt-3 space-y-3">
              {items.map((row, idx) => (
                <div key={idx} className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 text-xs">
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-12">
                    <div className="sm:col-span-4">
                      <label className="text-[11px] text-slate-500">Nama Barang / Uraian Nota</label>
                      <input
                        type="text"
                        value={row.itemName}
                        onChange={(e) => updateItem(idx, 'itemName', e.target.value)}
                        className="mt-0.5 w-full rounded border border-slate-300 bg-white p-1.5 text-xs"
                        required
                      />
                    </div>

                    <div className="sm:col-span-3">
                      <label className="text-[11px] text-slate-500">Nomor Nota / Faktur</label>
                      <input
                        type="text"
                        placeholder="INV-00129"
                        value={row.invoiceNumber}
                        onChange={(e) => updateItem(idx, 'invoiceNumber', e.target.value)}
                        className="mt-0.5 w-full rounded border border-slate-300 bg-white p-1.5 text-xs"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="text-[11px] text-slate-500">Qty Nyata</label>
                      <input
                        type="number"
                        min="0.1"
                        step="any"
                        value={row.actualQty}
                        onChange={(e) => updateItem(idx, 'actualQty', Number(e.target.value))}
                        className="mt-0.5 w-full rounded border border-slate-300 bg-white p-1.5 text-xs"
                        required
                      />
                    </div>

                    <div className="sm:col-span-3">
                      <label className="text-[11px] text-slate-500">Harga Satuan Nyata</label>
                      <input
                        type="number"
                        min="0"
                        value={row.actualUnitPrice}
                        onChange={(e) => updateItem(idx, 'actualUnitPrice', Number(e.target.value))}
                        className="mt-0.5 w-full rounded border border-slate-300 bg-white p-1.5 text-xs"
                        required
                      />
                    </div>
                  </div>

                  <div className="mt-2 flex items-center justify-between border-t border-slate-200/60 pt-2 text-[11px]">
                    <div className="flex items-center gap-2 text-slate-500">
                      <FileText className="h-3.5 w-3.5 text-blue-500" />
                      <span>Lampiran: {row.fileName || 'Kwitansi_Fisik.jpg'}</span>
                    </div>
                    <span className="font-bold text-slate-900">
                      Total: {formatRupiah(row.actualQty * row.actualUnitPrice)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Feedback Visual: Rekonsiliasi Kas */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="grid grid-cols-1 gap-2 text-xs sm:grid-cols-3">
              <div>
                <span className="text-slate-500">Dana Kasbon Awal:</span>
                <div className="text-base font-bold text-slate-900">{formatRupiah(requestedAmount)}</div>
              </div>
              <div>
                <span className="text-slate-500">Total Realisasi Belanja:</span>
                <div className="text-base font-bold text-slate-900">{formatRupiah(totalRealized)}</div>
              </div>
              <div>
                <span className="text-slate-500">Hasil Rekonsiliasi:</span>
                <div
                  className={`text-base font-bold ${
                    remainingBalance > 0
                      ? 'text-emerald-600'
                      : remainingBalance < 0
                      ? 'text-amber-600'
                      : 'text-slate-900'
                  }`}
                >
                  {remainingBalance > 0
                    ? `+ ${formatRupiah(remainingBalance)} (Sisa Kasbon Kembali)`
                    : remainingBalance < 0
                    ? `- ${formatRupiah(Math.abs(remainingBalance))} (Klaim Reimbursement)`
                    : 'Rp 0 (Jumlah Pas)'}
                </div>
              </div>
            </div>
          </div>

          {/* Footer Submit */}
          <div className="flex items-center justify-end gap-2 border-t pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Batal
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Mengirim LPJ...' : 'Kirim LPJ Realisasi'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
