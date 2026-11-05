'use client';

import * as React from 'react';
import {
  AlertTriangle,
  Building2,
  CheckCircle,
  FileCheck,
  FilePlus,
  Layers,
  LayoutDashboard,
  Receipt,
  Search,
  Wallet,
} from 'lucide-react';
import { formatDate, formatRupiah } from '@/lib/utils';
import { BudgetVarianceChart } from '@/components/dashboard/budget-variance-chart';
import { ExecutiveKpiCards } from '@/components/dashboard/executive-kpi-cards';
import { RecentActivityFeed } from '@/components/dashboard/recent-activity-feed';
import { ApprovalActionModal } from '@/components/modals/approval-action-modal';
import { CreateExpenseRequestModal } from '@/components/modals/create-expense-request-modal';
import { CreateRealizationModal } from '@/components/modals/create-realization-modal';
import { StatusBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';

// =========================================================================
// MOCK STATE SEED DATA (Synchronized with Fase 2 Seed Data)
// =========================================================================

const INITIAL_PROJECTS = [
  {
    id: '33333333-3333-3333-3333-333333333301',
    projectCode: 'PRJ-TBN-2026-001',
    name: 'Pembangunan Gudang & Fasilitas Operasional Tambun',
    categories: [
      {
        id: '44444444-4444-4444-4444-444444444401',
        categoryCode: 'CAT-01',
        name: 'Interior dan Furniture (Fit-Out Outlet)',
        items: [
          {
            id: '55555555-5555-5555-5555-555555555501',
            itemCode: 'ITM-FIT-001',
            name: 'Partisi Kaca & Meja Custom Resepsionis',
            unit: 'PAKET',
            unitPrice: 85000000,
            availableAmount: 70650000,
          },
          {
            id: '55555555-5555-5555-5555-555555555502',
            itemCode: 'ITM-FIT-002',
            name: 'Plafon Drop Ceiling, Vinyl & Cat Interior',
            unit: 'PAKET',
            unitPrice: 65000000,
            availableAmount: 65000000,
          },
        ],
      },
      {
        id: '44444444-4444-4444-4444-444444444402',
        categoryCode: 'CAT-02',
        name: 'Equipment dan Inventori (Hardware & Mesin)',
        items: [
          {
            id: '55555555-5555-5555-5555-555555555503',
            itemCode: 'ITM-EQP-001',
            name: 'Mesin Digital Printing Press & Plotter Utama',
            unit: 'UNIT',
            unitPrice: 277500000,
            availableAmount: 229500000,
          },
          {
            id: '55555555-5555-5555-5555-555555555504',
            itemCode: 'ITM-EQP-002',
            name: 'Komputer Kasir POS & Komputer Operator Grafis',
            unit: 'SET',
            unitPrice: 10000000,
            availableAmount: 7550000,
          },
          {
            id: '55555555-5555-5555-5555-555555555505',
            itemCode: 'ITM-EQP-003',
            name: 'Mesin Finishing & Laminasi Elektrik',
            unit: 'UNIT',
            unitPrice: 40000000,
            availableAmount: 23600000,
          },
        ],
      },
      {
        id: '44444444-4444-4444-4444-444444444403',
        categoryCode: 'CAT-03',
        name: 'Marketing Tools dan Stok Bahan Awal',
        items: [
          {
            id: '55555555-5555-5555-5555-555555555506',
            itemCode: 'ITM-MKT-001',
            name: 'Stok Bahan Kertas Art Paper, Sticker & Toner Awal',
            unit: 'PAKET',
            unitPrice: 120000000,
            availableAmount: 120000000,
          },
          {
            id: '55555555-5555-5555-5555-555555555507',
            itemCode: 'ITM-MKT-002',
            name: 'Signage Neon Box Luar & Promo Launching',
            unit: 'PAKET',
            unitPrice: 35000000,
            availableAmount: 35000000,
          },
        ],
      },
      {
        id: '44444444-4444-4444-4444-444444444404',
        categoryCode: 'CAT-04',
        name: 'Biaya Lisensi Brand, Perizinan & Legalitas',
        items: [
          {
            id: '55555555-5555-5555-5555-555555555508',
            itemCode: 'ITM-LEG-001',
            name: 'Lisensi Franchise Brand Snaprint & POS System',
            unit: 'PAKET',
            unitPrice: 88000000,
            availableAmount: 66000000,
          },
          {
            id: '55555555-5555-5555-5555-555555555509',
            itemCode: 'ITM-LEG-002',
            name: 'Perizinan Usaha, PBG & Sertifikasi Legalitas',
            unit: 'PAKET',
            unitPrice: 30000000,
            availableAmount: 14500000,
          },
        ],
      },
      {
        id: '44444444-4444-4444-4444-444444444405',
        categoryCode: 'CAT-05',
        name: 'Pekerjaan Tambahan & Contingency',
        items: [
          {
            id: '55555555-5555-5555-5555-555555555510',
            itemCode: 'ITM-CTG-001',
            name: 'Pekerjaan Tambahan Instalasi Daya Listrik PLN & Panel',
            unit: 'PAKET',
            unitPrice: 65000000,
            availableAmount: 65000000,
          },
          {
            id: '55555555-5555-5555-5555-555555555511',
            itemCode: 'ITM-CTG-002',
            name: 'Cadangan Kontinjensi & Biaya Tak Terduga Lapangan',
            unit: 'PAKET',
            unitPrice: 50000000,
            availableAmount: 50000000,
          },
        ],
      },
      {
        id: '44444444-4444-4444-4444-444444444406',
        categoryCode: 'CAT-06',
        name: 'Pekerjaan diluar busget tapi penting',
        items: [
          {
            id: '55555555-5555-5555-5555-555555555512',
            itemCode: 'ITM-EXT-001',
            name: 'Perbaikan Pompa Air Tanah & Saluran Limbah Darurat',
            unit: 'PAKET',
            unitPrice: 28000000,
            availableAmount: 28000000,
          },
          {
            id: '55555555-5555-5555-5555-555555555513',
            itemCode: 'ITM-EXT-002',
            name: 'Pengadaan Unit CCTV Keamanan & Stabilizer Mesin',
            unit: 'PAKET',
            unitPrice: 35000000,
            availableAmount: 35000000,
          },
        ],
      },
    ],
  },
];

const INITIAL_REQUESTS: any[] = [];

const INITIAL_REALIZATIONS: any[] = [];

const INITIAL_AUDITS = [
  {
    id: '1',
    action: 'SETTLE',
    entityName: 'REALIZATION',
    entityId: 'RLZ-TBN-202604-001',
    user: { id: 'u1', fullName: 'Siti Rahma (Finance)', email: 'siti@tambun.id' },
    newValues: { realizationNumber: 'RLZ-TBN-202604-001' },
    createdAt: '2026-04-15T15:00:00Z',
  },
  {
    id: '2',
    action: 'DISBURSE',
    entityName: 'EXPENSE_REQUEST',
    entityId: 'REQ-TBN-202604-002',
    user: { id: 'u1', fullName: 'Siti Rahma (Finance)', email: 'siti@tambun.id' },
    newValues: { requestNumber: 'REQ-TBN-202604-002' },
    createdAt: '2026-04-19T14:15:00Z',
  },
  {
    id: '3',
    action: 'APPROVE',
    entityName: 'EXPENSE_REQUEST',
    entityId: 'REQ-TBN-202605-001',
    user: { id: 'u2', fullName: 'Drs. Hendra Gunawan (Direktur)', email: 'hendra@tambun.id' },
    newValues: { requestNumber: 'REQ-TBN-202605-001' },
    createdAt: '2026-05-02T09:45:00Z',
  },
];

export default function DashboardPage() {
  const [activeTab, setActiveTab] = React.useState<'overview' | 'requests' | 'realizations'>('overview');

  // State Management
  const [requests, setRequests] = React.useState(INITIAL_REQUESTS);
  const [realizations, setRealizations] = React.useState(INITIAL_REALIZATIONS);
  const [auditLogs, setAuditLogs] = React.useState(INITIAL_AUDITS);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('ALL');

  // Modal States
  const [isRequestModalOpen, setIsRequestModalOpen] = React.useState(false);
  const [isRealizationModalOpen, setIsRealizationModalOpen] = React.useState(false);
  const [approvalModalState, setApprovalModalState] = React.useState<{
    isOpen: boolean;
    stageName: string;
    request: any;
  }>({
    isOpen: false,
    stageName: '',
    request: null,
  });

  // Calculate Reactive KPI Metrics
  const grandContractValue = 1850000000;
  const grandBudget = 1500000000;

  const grandCommitted = requests
    .filter((r) => ['DISBURSED', 'APPROVED_FINANCE', 'APPROVED_DIRECTOR', 'APPROVED_PM'].includes(r.currentStatus))
    .reduce((sum, r) => sum + Number(r.totalAmountRequested), 0);

  const grandRealized = realizations
    .filter((r) => r.status === 'SETTLED')
    .reduce((sum, r) => sum + Number(r.totalRealizedAmount), 0);

  const grandRemainingBudget = grandBudget - (grandCommitted + grandRealized);
  const burnRatePercent = (grandRealized / grandBudget) * 100;
  const committedPercent = (grandCommitted / grandBudget) * 100;

  const summary = {
    totalProjects: 1,
    grandContractValue,
    grandBudget,
    grandCommitted,
    grandRealized,
    grandRemainingBudget,
    burnRatePercent,
    committedPercent,
    totalExpenseRequests: requests.length,
    totalRealizations: realizations.length,
    overrunCount: 0,
  };

  const defaultAllocations: Record<string, number> = {
    'CAT-01': 350000000,
    'CAT-02': 550000000,
    'CAT-03': 200000000,
    'CAT-04': 150000000,
    'CAT-05': 150000000,
    'CAT-06': 100000000,
  };

  const categoriesMaster = [
    { categoryCode: 'CAT-01', name: 'Interior dan Furniture (Fit-Out Outlet)', allocatedAmount: 350000000 },
    { categoryCode: 'CAT-02', name: 'Equipment dan Inventori (Hardware & Mesin)', allocatedAmount: 550000000 },
    { categoryCode: 'CAT-03', name: 'Marketing Tools dan Stok Bahan Awal', allocatedAmount: 200000000 },
    { categoryCode: 'CAT-04', name: 'Biaya Lisensi Brand, Perizinan & Legalitas', allocatedAmount: 150000000 },
    { categoryCode: 'CAT-05', name: 'Pekerjaan Tambahan & Contingency', allocatedAmount: 150000000 },
    { categoryCode: 'CAT-06', name: 'Pekerjaan diluar busget tapi penting', allocatedAmount: 100000000 },
  ];

  const categoriesSummary = categoriesMaster.map((cat) => {
    const catRequests = requests.filter(
      (r: any) =>
        (r.categoryId === cat.categoryCode || r.items?.[0]?.categoryId === cat.categoryCode) &&
        (r.currentStatus === 'DISBURSED' || r.currentStatus === 'APPROVED_DIRECTOR')
    );
    const catRealizations = realizations.filter(
      (rz: any) => rz.categoryId === cat.categoryCode || rz.categoryCode === cat.categoryCode
    );

    const committed = catRequests.reduce((sum: number, r: any) => sum + Number(r.totalAmountRequested || 0), 0);
    const realized = catRealizations.reduce((sum: number, r: any) => sum + Number(r.totalRealizedAmount || 0), 0);
    const totalUsed = committed + realized;
    const usagePercent = cat.allocatedAmount > 0 ? (totalUsed / cat.allocatedAmount) * 100 : 0;

    return {
      categoryCode: cat.categoryCode,
      name: cat.name,
      allocatedAmount: cat.allocatedAmount,
      committedAmount: committed,
      realizedAmount: realized,
      usagePercent,
    };
  });

  // Disbursed requests available for LPJ creation
  const disbursedRequests = requests.filter((r) => r.currentStatus === 'DISBURSED');

  // Handlers
  const handleCreateRequest = async (payload: any) => {
    const newReqNumber = `REQ-TBN-202605-${String(requests.length + 1).padStart(3, '0')}`;
    const newReq = {
      id: String(Date.now()),
      requestNumber: newReqNumber,
      title: payload.title,
      totalAmountRequested: payload.items.reduce((s: number, i: any) => s + i.requestedQty * i.estimatedUnitPrice, 0),
      currentStatus: 'SUBMITTED',
      needByDate: payload.needByDate,
      requesterName: 'Eko Prasetyo, ST (Lapangan)',
      projectName: 'Pembangunan Gudang Tambun',
      type: payload.type,
      items: payload.items,
    };

    setRequests([newReq, ...requests]);
    setAuditLogs([
      {
        id: String(Date.now()),
        action: 'SUBMIT',
        entityName: 'EXPENSE_REQUEST',
        entityId: newReqNumber,
        user: { id: 'u1', fullName: 'Eko Prasetyo, ST', email: 'eko@tambun.id' },
        newValues: { requestNumber: newReqNumber },
        createdAt: new Date().toISOString(),
      },
      ...auditLogs,
    ]);
  };

  const handleCreateRealization = async (payload: any) => {
    const targetReq = requests.find((r) => r.id === payload.requestId);
    const totalRealized = payload.items.reduce((s: number, i: any) => s + i.actualQty * i.actualUnitPrice, 0);
    const requested = targetReq ? Number(targetReq.totalAmountRequested) : 0;
    const remaining = requested - totalRealized;

    const newRlzNumber = `RLZ-TBN-202605-${String(realizations.length + 1).padStart(3, '0')}`;
    const newRlz = {
      id: String(Date.now()),
      realizationNumber: newRlzNumber,
      requestNumber: targetReq ? targetReq.requestNumber : 'REQ',
      title: targetReq ? targetReq.title : 'Realisasi Belanja Lapangan',
      totalRequested: requested,
      totalRealizedAmount: totalRealized,
      remainingBalance: remaining,
      status: 'VERIFIED_FINANCE',
      submitterName: 'Eko Prasetyo, ST',
      verifierName: 'Menunggu Verifikasi',
      createdAt: new Date().toISOString(),
    };

    setRealizations([newRlz, ...realizations]);
  };

  const handleConfirmApproval = async (decision: string, comment: string) => {
    const target = approvalModalState.request;
    if (!target) return;

    let nextStatus = 'APPROVED_PM';
    if (decision === 'REJECTED') nextStatus = 'REJECTED';
    else if (decision === 'REVISION_REQUESTED') nextStatus = 'REVISION_REQUESTED';
    else {
      if (approvalModalState.stageName.includes('PM')) {
        nextStatus = target.totalAmountRequested > 25000000 ? 'APPROVED_DIRECTOR' : 'APPROVED_FINANCE';
      } else if (approvalModalState.stageName.includes('Direksi')) {
        nextStatus = 'APPROVED_FINANCE';
      } else {
        nextStatus = 'DISBURSED';
      }
    }

    setRequests(requests.map((r) => (r.id === target.id ? { ...r, currentStatus: nextStatus } : r)));
  };

  // Filtered lists
  const filteredRequests = requests.filter((r) => {
    const matchSearch =
      r.requestNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = statusFilter === 'ALL' || r.currentStatus === statusFilter;
    return matchSearch && matchStatus;
  });

  // Table Columns
  const requestColumns = [
    {
      key: 'requestNumber',
      header: 'No. Tiket',
      sortable: true,
      render: (r: any) => (
        <div>
          <span className="font-bold text-slate-900">{r.requestNumber}</span>
          <div className="text-[11px] text-slate-400">{r.type}</div>
        </div>
      ),
    },
    {
      key: 'title',
      header: 'Uraian Belanja Kasbon',
      render: (r: any) => (
        <div className="max-w-xs">
          <div className="font-medium text-slate-800">{r.title}</div>
          <div className="text-[11px] text-slate-500">Oleh: {r.requesterName}</div>
        </div>
      ),
    },
    {
      key: 'totalAmountRequested',
      header: 'Nominal',
      sortable: true,
      render: (r: any) => (
        <span className="font-bold text-slate-900">{formatRupiah(r.totalAmountRequested)}</span>
      ),
    },
    {
      key: 'needByDate',
      header: 'Tenggat',
      render: (r: any) => formatDate(r.needByDate),
    },
    {
      key: 'currentStatus',
      header: 'Status Alur',
      render: (r: any) => <StatusBadge status={r.currentStatus} />,
    },
    {
      key: 'actions',
      header: 'Aksi Cepat',
      render: (r: any) => (
        <div className="flex items-center gap-1.5">
          {r.currentStatus === 'SUBMITTED' && (
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                setApprovalModalState({
                  isOpen: true,
                  stageName: 'Review Project Manager',
                  request: r,
                })
              }
            >
              Review PM
            </Button>
          )}

          {r.currentStatus === 'APPROVED_DIRECTOR' && (
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                setApprovalModalState({
                  isOpen: true,
                  stageName: 'Persetujuan Finance (Cairkan)',
                  request: r,
                })
              }
            >
              Cairkan Dana
            </Button>
          )}

          {r.currentStatus === 'DISBURSED' && (
            <Button size="sm" variant="success" onClick={() => setIsRealizationModalOpen(true)}>
              Laporkan LPJ
            </Button>
          )}

          {r.currentStatus === 'SETTLED' && (
            <span className="text-xs font-semibold text-emerald-600">✓ Selesai</span>
          )}
        </div>
      ),
    },
  ];

  const realizationColumns = [
    {
      key: 'realizationNumber',
      header: 'No. LPJ Realisasi',
      render: (row: any) => (
        <div>
          <span className="font-bold text-slate-900">{row.realizationNumber}</span>
          <div className="text-[11px] text-slate-400">Kasbon: {row.requestNumber}</div>
        </div>
      ),
    },
    {
      key: 'title',
      header: 'Uraian Belanja & Nota',
      render: (row: any) => (
        <div className="max-w-xs">
          <div className="font-medium text-slate-800">{row.title}</div>
          <div className="text-[11px] text-slate-500">Pelapor: {row.submitterName}</div>
        </div>
      ),
    },
    {
      key: 'totalRequested',
      header: 'Kasbon Awal',
      render: (row: any) => formatRupiah(row.totalRequested),
    },
    {
      key: 'totalRealizedAmount',
      header: 'Realisasi Aktual',
      render: (row: any) => (
        <span className="font-bold text-slate-900">{formatRupiah(row.totalRealizedAmount)}</span>
      ),
    },
    {
      key: 'remainingBalance',
      header: 'Selisih Kas',
      render: (row: any) => (
        <span
          className={`font-semibold ${
            row.remainingBalance > 0
              ? 'text-emerald-600'
              : row.remainingBalance < 0
              ? 'text-amber-600'
              : 'text-slate-600'
          }`}
        >
          {row.remainingBalance > 0
            ? `+ ${formatRupiah(row.remainingBalance)} (Sisa Kasbon)`
            : row.remainingBalance < 0
            ? `- ${formatRupiah(Math.abs(row.remainingBalance))} (Klaim)`
            : 'Rp 0 (Pas)'}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status LPJ',
      render: (row: any) => <StatusBadge status={row.status} />,
    },
    {
      key: 'actions',
      header: 'Aksi',
      render: (row: any) =>
        row.status === 'VERIFIED_FINANCE' ? (
          <Button
            size="sm"
            variant="success"
            onClick={() =>
              setRealizations(
                realizations.map((item) =>
                  item.id === row.id ? { ...item, status: 'SETTLED' } : item,
                ),
              )
            }
          >
            Tutup Settlement
          </Button>
        ) : (
          <span className="text-xs text-slate-400">Telah Diverifikasi</span>
        ),
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50/60 pb-16">
      {/* Top Navigation */}
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white shadow-md">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900 leading-tight">
                Monitoring Realisasi Dana Proyek Tambun
              </h1>
              <p className="text-xs text-slate-500">
                Pusat Kendali Anggaran, Kasbon Lapangan & Laporan Pertanggungjawaban
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-sm"
              onClick={handleSaveAllChanges}
            >
              <Save className="mr-1.5 h-3.5 w-3.5" /> Simpan Perubahan Data
            </Button>
            <Button size="sm" variant="outline" onClick={() => setIsRealizationModalOpen(true)}>
              <Receipt className="mr-1.5 h-3.5 w-3.5" /> Input LPJ Belanja
            </Button>
            <Button size="sm" onClick={() => setIsRequestModalOpen(true)}>
              <FilePlus className="mr-1.5 h-3.5 w-3.5" /> Pengajuan Kasbon
            </Button>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="mx-auto flex max-w-7xl px-4 sm:px-6">
          <nav className="flex space-x-6 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex items-center gap-1.5 border-b-2 py-3 transition-colors ${
                activeTab === 'overview'
                  ? 'border-slate-900 text-slate-900'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <LayoutDashboard className="h-4 w-4" /> Dashboard Eksekutif
            </button>
            <button
              onClick={() => setActiveTab('requests')}
              className={`flex items-center gap-1.5 border-b-2 py-3 transition-colors ${
                activeTab === 'requests'
                  ? 'border-slate-900 text-slate-900'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Wallet className="h-4 w-4" /> Kategori Budget ({requests.length})
            </button>
            <button
              onClick={() => setActiveTab('realizations')}
              className={`flex items-center gap-1.5 border-b-2 py-3 transition-colors ${
                activeTab === 'realizations'
                  ? 'border-slate-900 text-slate-900'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <FileCheck className="h-4 w-4" /> Pemakaian Dana ({realizations.length})
            </button>
          </nav>
        </div>

        {saveSuccessMsg && (
          <div className="bg-emerald-600 text-white text-xs font-semibold py-2 px-4 text-center flex items-center justify-center gap-2 shadow-inner">
            <CheckCircle className="h-4 w-4" />
            <span>{saveSuccessMsg}</span>
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 space-y-6">
        {/* TAB 1: OVERVIEW DASHBOARD */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <ExecutiveKpiCards summary={summary} />

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <BudgetVarianceChart categories={categoriesSummary} />
              </div>
              <div className="lg:col-span-1">
                <RecentActivityFeed logs={auditLogs} />
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: EXPENSE REQUESTS TABLE */}
        {activeTab === 'requests' && (
          <div className="space-y-4">
            <DataTable
              columns={requestColumns}
              data={filteredRequests}
              searchPlaceholder="Cari nomor tiket atau uraian belanja..."
              searchValue={searchQuery}
              onSearchChange={setSearchQuery}
              filterComponent={
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 shadow-sm focus:border-blue-500 focus:outline-none"
                >
                  <option value="ALL">Semua Status</option>
                  <option value="SUBMITTED">Menunggu Review</option>
                  <option value="APPROVED_DIRECTOR">Disetujui Direksi</option>
                  <option value="DISBURSED">Dana Dicairkan</option>
                  <option value="SETTLED">Selesai / LPJ Ditutup</option>
                </select>
              }
              actionButton={
                <Button size="sm" onClick={() => setIsRequestModalOpen(true)}>
                  <FilePlus className="mr-1.5 h-3.5 w-3.5" /> Buat Pengajuan Baru
                </Button>
              }
            />
          </div>
        )}

        {/* TAB 3: REALIZATIONS & SETTLEMENT TABLE */}
        {activeTab === 'realizations' && (
          <div className="space-y-4">
            <DataTable
              columns={realizationColumns}
              data={realizations}
              searchPlaceholder="Cari nomor LPJ atau nomor tiket kasbon..."
              searchValue={searchQuery}
              onSearchChange={setSearchQuery}
              actionButton={
                <Button size="sm" variant="success" onClick={() => setIsRealizationModalOpen(true)}>
                  <Receipt className="mr-1.5 h-3.5 w-3.5" /> Buat LPJ Baru
                </Button>
              }
            />
          </div>
        )}
      </main>

      {/* Modals */}
      <CreateExpenseRequestModal
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
        onSubmit={handleCreateRequest}
        projects={INITIAL_PROJECTS}
      />

      <CreateRealizationModal
        isOpen={isRealizationModalOpen}
        onClose={() => setIsRealizationModalOpen(false)}
        onSubmit={handleCreateRealization}
        disbursedRequests={disbursedRequests}
      />

      <ApprovalActionModal
        isOpen={approvalModalState.isOpen}
        onClose={() => setApprovalModalState({ isOpen: false, stageName: '', request: null })}
        onConfirm={handleConfirmApproval}
        request={approvalModalState.request}
        stageName={approvalModalState.stageName}
      />
    </div>
  );
}
