'use client';

import * as React from 'react';
import { AlertCircle, AlertTriangle, Plus, Trash2, X } from 'lucide-react';
import { formatRupiah } from '@/lib/utils';
import { Button } from '../ui/button';

interface BudgetItemOption {
  id: string;
  itemCode: string;
  name: string;
  unit: string;
  unitPrice: number;
  availableAmount: number;
}

interface BudgetCategoryOption {
  id: string;
  categoryCode: string;
  name: string;
  items: BudgetItemOption[];
}

interface ProjectOption {
  id: string;
  projectCode: string;
  name: string;
  categories: BudgetCategoryOption[];
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: any) => Promise<void>;
  projects: ProjectOption[];
}

export function CreateExpenseRequestModal({ isOpen, onClose, onSubmit, projects }: Props) {
  const [selectedProjectId, setSelectedProjectId] = React.useState<string>('');
  const [title, setTitle] = React.useState('');
  const [purpose, setPurpose] = React.useState('');
  const [type, setType] = React.useState('CASH_ADVANCE');
  const [needByDate, setNeedByDate] = React.useState('');
  const [notes, setNotes] = React.useState('');

  const [items, setItems] = React.useState<
    Array<{
      categoryId: string;
      budgetItemId: string;
      description: string;
      requestedQty: number;
      estimatedUnitPrice: number;
    }>
  >([]);

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);

  // Auto-select first project if available
  React.useEffect(() => {
    if (projects.length > 0 && !selectedProjectId) {
      setSelectedProjectId(projects[0].id);
    }
  }, [projects, selectedProjectId]);

  const activeProject = projects.find((p) => p.id === selectedProjectId);

  const addItemRow = () => {
    if (!activeProject || activeProject.categories.length === 0) return;
    const firstCat = activeProject.categories[0];
    const firstItem = firstCat.items[0];

    setItems((prev) => [
      ...prev,
      {
        categoryId: firstCat.id,
        budgetItemId: firstItem ? firstItem.id : '',
        description: '',
        requestedQty: 1,
        estimatedUnitPrice: firstItem ? Number(firstItem.unitPrice) : 0,
      },
    ]);
  };

  const updateItem = (index: number, field: string, val: any) => {
    setItems((prev) => {
      const next = [...prev];
      const current = { ...next[index], [field]: val };

      // Jika ubah category, reset item
      if (field === 'categoryId') {
        const cat = activeProject?.categories.find((c) => c.id === val);
        const firstItem = cat?.items[0];
        current.budgetItemId = firstItem ? firstItem.id : '';
        current.estimatedUnitPrice = firstItem ? Number(firstItem.unitPrice) : 0;
      }

      // Jika ubah budget item, sesuaikan unit price default
      if (field === 'budgetItemId') {
        const cat = activeProject?.categories.find((c) => c.id === current.categoryId);
        const itm = cat?.items.find((i) => i.id === val);
        if (itm) {
          current.estimatedUnitPrice = Number(itm.unitPrice);
        }
      }

      next[index] = current;
      return next;
    });
  };

  const removeItemRow = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const totalCalculated = items.reduce(
    (sum, itm) => sum + Number(itm.requestedQty) * Number(itm.estimatedUnitPrice),
    0,
  );

  // Validasi over-budget per item
  const itemOverruns = items.map((itm) => {
    const cat = activeProject?.categories.find((c) => c.id === itm.categoryId);
    const budgetItem = cat?.items.find((i) => i.id === itm.budgetItemId);
    const subtotal = Number(itm.requestedQty) * Number(itm.estimatedUnitPrice);
    const available = budgetItem ? Number(budgetItem.availableAmount) : 0;
    const isOver = subtotal > available;
    return { isOver, available, subtotal, itemName: budgetItem?.name || '' };
  });

  const hasAnyOverrun = itemOverruns.some((o) => o.isOver);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (items.length === 0) {
      setFormError('Harap tambahkan minimal 1 baris item pengeluaran.');
      return;
    }

    if (hasAnyOverrun) {
      setFormError('Terdapat item yang melampaui sisa pagu anggaran! Harap sesuaikan kuantitas atau harga.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        projectId: selectedProjectId,
        type,
        title,
        purpose,
        needByDate,
        notes,
        items: items.map((i) => ({
          budgetItemId: i.budgetItemId,
          description: i.description || 'Pengadaan lapangan',
          requestedQty: Number(i.requestedQty),
          estimatedUnitPrice: Number(i.estimatedUnitPrice),
        })),
      });
      onClose();
    } catch (err: any) {
      setFormError(err.message || 'Gagal menyimpan pengajuan.');
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
            <h2 className="text-lg font-bold text-slate-900">Form Pengajuan Kas Bon & Pengeluaran</h2>
            <p className="text-xs text-slate-500">Isi detail kebutuhan belanja proyek Tambun secara lengkap.</p>
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
              <label className="block text-xs font-semibold text-slate-700">Pilih Proyek Sasaran</label>
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-blue-500 focus:outline-none"
                required
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.projectCode} - {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">Tipe Pengeluaran</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-blue-500 focus:outline-none"
              >
                <option value="CASH_ADVANCE">Kas Bon Operasional (Cash Advance)</option>
                <option value="DIRECT_PURCHASE">Pembelian Langsung / PO (Direct Purchase)</option>
                <option value="REIMBURSEMENT">Reimbursement Biaya Lapangan</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">Judul Pengajuan</label>
              <input
                type="text"
                placeholder="Misal: Kas Bon Pembelian Semen & Pasir Cor"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-blue-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">Target Tanggal Dibutuhkan</label>
              <input
                type="date"
                value={needByDate}
                onChange={(e) => setNeedByDate(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-blue-500 focus:outline-none"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">Tujuan & Urgensi Pengeluaran</label>
            <textarea
              rows={2}
              placeholder="Jelaskan kebutuhan teknis lapangan..."
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-blue-500 focus:outline-none"
              required
            />
          </div>

          {/* Rincian Item Belanja */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Rincian Item Pagu Biaya
              </span>
              <Button type="button" size="sm" variant="outline" onClick={addItemRow}>
                <Plus className="mr-1 h-3.5 w-3.5" /> Tambah Item
              </Button>
            </div>

            <div className="mt-3 space-y-3">
              {items.length === 0 ? (
                <div className="rounded-lg border border-dashed border-slate-200 p-6 text-center text-xs text-slate-400">
                  Belum ada item belanja. Klik tombol di atas untuk menambah item.
                </div>
              ) : (
                items.map((row, idx) => {
                  const overrun = itemOverruns[idx];
                  const activeCat = activeProject?.categories.find((c) => c.id === row.categoryId);

                  return (
                    <div
                      key={idx}
                      className={`rounded-xl border p-3 text-xs transition-all ${
                        overrun?.isOver ? 'border-rose-300 bg-rose-50/50' : 'border-slate-200 bg-slate-50/60'
                      }`}
                    >
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-12">
                        {/* WBS Category */}
                        <div className="sm:col-span-3">
                          <label className="text-[11px] text-slate-500">Kategori WBS</label>
                          <select
                            value={row.categoryId}
                            onChange={(e) => updateItem(idx, 'categoryId', e.target.value)}
                            className="mt-0.5 w-full rounded border border-slate-300 bg-white p-1.5 text-xs"
                          >
                            {activeProject?.categories.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.categoryCode} - {c.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Budget Item */}
                        <div className="sm:col-span-4">
                          <label className="text-[11px] text-slate-500">Akun Anggaran (Item RAB)</label>
                          <select
                            value={row.budgetItemId}
                            onChange={(e) => updateItem(idx, 'budgetItemId', e.target.value)}
                            className="mt-0.5 w-full rounded border border-slate-300 bg-white p-1.5 text-xs"
                          >
                            {activeCat?.items.map((i) => (
                              <option key={i.id} value={i.id}>
                                {i.itemCode} - {i.name} (Sisa: {formatRupiah(i.availableAmount)})
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Qty */}
                        <div className="sm:col-span-2">
                          <label className="text-[11px] text-slate-500">Kuantitas</label>
                          <input
                            type="number"
                            min="0.1"
                            step="any"
                            value={row.requestedQty}
                            onChange={(e) => updateItem(idx, 'requestedQty', Number(e.target.value))}
                            className="mt-0.5 w-full rounded border border-slate-300 bg-white p-1.5 text-xs"
                            required
                          />
                        </div>

                        {/* Unit Price */}
                        <div className="sm:col-span-2">
                          <label className="text-[11px] text-slate-500">Harga Satuan</label>
                          <input
                            type="number"
                            min="0"
                            value={row.estimatedUnitPrice}
                            onChange={(e) => updateItem(idx, 'estimatedUnitPrice', Number(e.target.value))}
                            className="mt-0.5 w-full rounded border border-slate-300 bg-white p-1.5 text-xs"
                            required
                          />
                        </div>

                        {/* Delete Row */}
                        <div className="flex items-end justify-end sm:col-span-1">
                          <button
                            type="button"
                            onClick={() => removeItemRow(idx)}
                            className="p-1.5 text-slate-400 hover:text-rose-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      {/* Subtotal & Feedback Over-Budget */}
                      <div className="mt-2 flex items-center justify-between border-t border-slate-200/60 pt-2 text-[11px]">
                        <span className="text-slate-500">
                          Subtotal:{' '}
                          <span className="font-bold text-slate-900">
                            {formatRupiah(row.requestedQty * row.estimatedUnitPrice)}
                          </span>
                        </span>

                        {overrun?.isOver ? (
                          <span className="inline-flex items-center font-bold text-rose-600">
                            <AlertTriangle className="mr-1 h-3.5 w-3.5" />
                            Over-Budget! Sisa pagu hanya {formatRupiah(overrun.available)}
                          </span>
                        ) : (
                          <span className="text-emerald-600">✓ Dalam batas pagu tersedia</span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Footer Total & Submit */}
          <div className="flex items-center justify-between border-t pt-4">
            <div>
              <span className="text-xs text-slate-500">Total Nominal Pengajuan:</span>
              <div className="text-xl font-black text-slate-900">{formatRupiah(totalCalculated)}</div>
            </div>

            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                Batal
              </Button>
              <Button type="submit" disabled={isSubmitting || hasAnyOverrun}>
                {isSubmitting ? 'Menyimpan...' : 'Kirim Pengajuan Kasbon'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
