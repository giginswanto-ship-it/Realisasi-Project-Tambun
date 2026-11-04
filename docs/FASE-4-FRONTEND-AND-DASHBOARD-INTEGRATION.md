# FASE 4: DYNAMIC FRONTEND & DASHBOARD INTEGRATION
## Sistem Monitoring Pembelanjaan Proyek (Realisasi Dana Proyek Tambun)

---

## 1. Executive Summary

Fase 4 merealisasikan integrasi penuh antara backend data engine (Fase 2 & 3) ke antarmuka pengguna interaktif (*modern web application*) berbasis **Next.js 14**, **Tailwind CSS**, dan **shadcn/ui**. Antarmuka ini dirancang untuk melayani dua profil pengguna utama:
1. **Site Engineer & Tim Lapangan**: Tampilan responsif yang mempermudah pengajuan kasbon cepat dan pelaporan LPJ bukti nota/faktur di lapangan proyek Tambun.
2. **Project Manager, Finance & Direksi**: Dashboard kendali eksekutif dengan metrik performa anggaran (*burn rate*, rasio komitmen kasbon, sisa pagu anggaran) serta tabel approval multi-tahap.

Berkas sumber daya telah diimplementasikan pada:
- **Halaman Utama Dashboard**: [`apps/web/src/app/page.tsx`](file:///c:/Users/Swanto/OneDrive/Desktop/REALISASI%20DANA%20PROJECT%20TAMBUN/apps/web/src/app/page.tsx)
- **Komponen Data Table Dinamis**: [`apps/web/src/components/ui/data-table.tsx`](file:///c:/Users/Swanto/OneDrive/Desktop/REALISASI%20DANA%20PROJECT%20TAMBUN/apps/web/src/components/ui/data-table.tsx)
- **Modal Pengajuan Kasbon Relasional**: [`apps/web/src/components/modals/create-expense-request-modal.tsx`](file:///c:/Users/Swanto/OneDrive/Desktop/REALISASI%20DANA%20PROJECT%20TAMBUN/apps/web/src/components/modals/create-expense-request-modal.tsx)
- **Modal LPJ & Rekonsiliasi Kasbon**: [`apps/web/src/components/modals/create-realization-modal.tsx`](file:///c:/Users/Swanto/OneDrive/Desktop/REALISASI%20DANA%20PROJECT%20TAMBUN/apps/web/src/components/modals/create-realization-modal.tsx)
- **Modal Keputusan Persetujuan (Approval)**: [`apps/web/src/components/modals/approval-action-modal.tsx`](file:///c:/Users/Swanto/OneDrive/Desktop/REALISASI%20DANA%20PROJECT%20TAMBUN/apps/web/src/components/modals/approval-action-modal.tsx)
- **Kartu Metrik KPI Eksekutif**: [`apps/web/src/components/dashboard/executive-kpi-cards.tsx`](file:///c:/Users/Swanto/OneDrive/Desktop/REALISASI%20DANA%20PROJECT%20TAMBUN/apps/web/src/components/dashboard/executive-kpi-cards.tsx)
- **Grafik Distribusi WBS**: [`apps/web/src/components/dashboard/budget-variance-chart.tsx`](file:///c:/Users/Swanto/OneDrive/Desktop/REALISASI%20DANA%20PROJECT%20TAMBUN/apps/web/src/components/dashboard/budget-variance-chart.tsx)

---

## 2. Arsitektur Komponen UI Modular

```
+----------------------------------------------------------------------------------------+
|                                    HEADER & TAB NAVIGATION                             |
|  [Ikhtisar Eksekutif]          [Pengajuan Kasbon (4)]         [Realisasi LPJ (2)]      |
+----------------------------------------------------------------------------------------+
|                                                                                        |
|  [TAB 1: IKHTISAR EKSEKUTIF]                                                           |
|  +--------------------+--------------------+--------------------+--------------------+ |
|  | TOTAL PAGU ANGGARAN| KAS BON DICAIRKAN  | REALISASI SAH (LPJ)| SISA PAGU TERSEDIA | |
|  |  Rp 1.500.000.000  |   Rp 84.500.000    |   Rp 22.750.000    |  Rp 1.392.750.000  | |
|  | Kontrak: 1.85 M    | Komitmen: 5.6%     | Burn-rate: 1.5%    | Pagu Sehat ✓       | |
|  +--------------------+--------------------+--------------------+--------------------+ |
|                                                                                        |
|  +---------------------------------------------+ +-----------------------------------+ |
|  |    DISTRIBUSI ANGGARAN PER WBS PROYEK       | |     JEJAK AUDIT & AKTIVITAS       | |
|  | - WBS-01 (Tanah & Pondasi): 4.1% terserap    | | • Siti Rahma: Tutup Settlement    | |
|  | - WBS-02 (Struktur Baja):  10.7% terserap   | | • Siti Rahma: Cairkan Kasbon      | |
|  | - WBS-04 (Alat Berat & BBM): 8.6% terserap  | | • Hendra Gunawan: Approve Direksi | |
|  +---------------------------------------------+ +-----------------------------------+ |
|                                                                                        |
|  [TAB 2 & 3: MODULAR DATA TABLE]                                                       |
|  [Search Input...]  [Filter Status Dropdown v]                  [+ Buat Pengajuan Baru] |
|  +-----------------------------------------------------------------------------------+ |
|  | No Tiket | Uraian Belanja | Nominal | Tenggat | Status Alur | Aksi Cepat            | |
|  +-----------------------------------------------------------------------------------+ |
+----------------------------------------------------------------------------------------+
```

---

## 3. Fitur Utama & Validasi Logika Lapangan

### 3.1 Form Dinamis & Early Warning Over-Budget
Pada modal [`CreateExpenseRequestModal`](file:///c:/Users/Swanto/OneDrive/Desktop/REALISASI%20DANA%20PROJECT%20TAMBUN/apps/web/src/components/modals/create-expense-request-modal.tsx):
- Pengguna memilih **Proyek** $\rightarrow$ otomatis memfilter **Kategori WBS** $\rightarrow$ memfilter **Item Anggaran (RAB)**.
- Setiap kali kuantitas atau harga satuan diubah, subtotal dihitung secara *real-time*.
- **Pemeriksaan Pagu Otomatis**: Jika $\text{Subtotal} > \text{Available Pagu}$, sistem memunculkan indikator visual merah:
  > `⚠️ Over-Budget! Sisa pagu hanya Rp X`
- Tombol *submit* dikunci (*disabled*) hingga nominal disesuaikan agar tidak melampaui batas anggaran.

### 3.2 LPJ Belanja & Rekonsiliasi Selisih Kas
Pada modal [`CreateRealizationModal`](file:///c:/Users/Swanto/OneDrive/Desktop/REALISASI%20DANA%20PROJECT%20TAMBUN/apps/web/src/components/modals/create-realization-modal.tsx):
- Menghubungkan nota fisik ke tiket kasbon yang berstatus `DISBURSED`.
- Mengkalkulasi selisih secara otomatis:
  $$\text{Remaining Balance} = \text{Requested Amount} - \text{Total Realized}$$
- Memberikan feedback visual 3 kondisi:
  1. $\text{Selisih} > 0$: **Sisa Kasbon Lebih** (dana harus disetor kembali ke kas proyek).
  2. $\text{Selisih} < 0$: **Kekurangan Belanja** (diajukan sebagai penggantian/reimbursement).
  3. $\text{Selisih} = 0$: **Jumlah Pas** (rekonsiliasi tuntas tanpa pengembalian).

### 3.3 Modal Approval Berjenjang
Pada modal [`ApprovalActionModal`](file:///c:/Users/Swanto/OneDrive/Desktop/REALISASI%20DANA%20PROJECT%20TAMBUN/apps/web/src/components/modals/approval-action-modal.tsx):
- Memfasilitasi pengambilan keputusan oleh Project Manager, Direktur, atau Finance.
- Opsi keputusan interaktif dengan palet warna kontekstual:
  - **Setujui (Approve)**: Hijau (*Emerald*)
  - **Minta Revisi**: Kuning (*Amber*)
  - **Tolak (Reject)**: Merah (*Rose*)
- Kolom catatan keputusan wajib/opsional tersimpan ke dalam tabel audit.

---

## 4. Matriks Visual Feedback & Status Badges

| Status Transaksi | Varian Badge | Indikator Visual | Arti Operasional |
| :--- | :---: | :---: | :--- |
| `DRAFT` | Outline | Abu-abu | Tiket baru dirancang di lapangan, belum dikirim. |
| `SUBMITTED` | Warning | Kuning Amber | Menunggu persetujuan Project Manager Tambun. |
| `APPROVED_PM` | Info | Biru | Disetujui PM, diteruskan ke Finance / Direksi. |
| `APPROVED_DIRECTOR` | Purple | Ungu | Pengadaan > Rp 25 Juta telah disetujui Direktur. |
| `APPROVED_FINANCE` | Purple | Ungu | Siap ditransfer oleh kasir/finance. |
| `DISBURSED` | Info | Biru | Dana telah dicairkan ke Site Engineer di lapangan. |
| `VERIFIED_FINANCE`| Purple | Ungu | Kwitansi/nota belanja sah diperiksa oleh Finance. |
| `SETTLED` | Success | Hijau Emerald | Rekonsiliasi tuntas, pagu terpotong secara permanen. |
| `REJECTED` | Danger | Merah Rose | Pengajuan kasbon ditolak. |
| `OVERRUN` | Danger | Merah Rose | Peringatan belanja melebihi pagu awal. |

---

## 5. Cara Menjalankan Aplikasi Frontend

Untuk menjalankan aplikasi web pada lingkungan lokal:

```bash
# 1. Pindah ke direktori frontend
cd apps/web

# 2. Jalankan development server
pnpm dev
# Aplikasi dapat diakses pada browser di: http://localhost:3000
```
