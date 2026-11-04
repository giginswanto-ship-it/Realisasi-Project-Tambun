# FASE 2: DATABASE SCHEMA, CONSTRAINTS & MIGRATION BLUEPRINT
## Sistem Monitoring Pembelanjaan Proyek (Realisasi Dana Proyek Tambun)

---

## 1. Executive Summary

Fase 2 merealisasikan rancangan konseptual Fase 1 ke dalam bentuk fisik skema database relasional tingkat produksi (*production-grade*). 
Fokus utama implementasi ini meliputi:
1. **Presisi Finansial**: Menggunakan `NUMERIC(15, 2)` dan *domain check constraints* untuk mencegah angka minus atau ketidakakuratan sen/rupiah.
2. **Integritas Relasional Ketat**: Aturan referensi *Foreign Key* (`RESTRICT` untuk transaksi penting dan `CASCADE` untuk item turunan) serta *Unique composite index*.
3. **Audit Trail Otomatis**: Trigger function PostgreSQL level-mesin untuk `updated_at` dan tabel terpusat `audit_logs` berbasis JSONB.
4. **Mock Seed Dataset**: Kumpulan 5–10 baris data per entitas yang saling berkorelasi secara riil dalam konteks proyek konstruksi Tambun.

Berkas sumber daya telah disimpan pada:
- **Prisma Schema**: [`packages/database/prisma/schema.prisma`](file:///c:/Users/Swanto/OneDrive/Desktop/REALISASI%20DANA%20PROJECT%20TAMBUN/packages/database/prisma/schema.prisma)
- **SQL Migration DDL**: [`packages/database/prisma/migrations/20261104000000_init/migration.sql`](file:///c:/Users/Swanto/OneDrive/Desktop/REALISASI%20DANA%20PROJECT%20TAMBUN/packages/database/prisma/migrations/20261104000000_init/migration.sql)
- **SQL Mock Seed**: [`packages/database/prisma/seeds/seed.sql`](file:///c:/Users/Swanto/OneDrive/Desktop/REALISASI%20DANA%20PROJECT%20TAMBUN/packages/database/prisma/seeds/seed.sql)

---

## 2. Arsitektur Relasi & Integritas Data (Relational Constraints)

### 2.1 Matriks Aturan Referensi (ON DELETE / ON UPDATE)

| Tabel Induk | Tabel Anak | Kolom FK | Aturan ON DELETE | Justifikasi Bisnis |
| :--- | :--- | :--- | :---: | :--- |
| `roles` | `users` | `role_id` | **RESTRICT** | Role tidak boleh dihapus jika masih ada pengguna aktif yang menggunakannya. |
| `projects` | `budget_categories` | `project_id` | **CASCADE** | Jika draft proyek dihapus, seluruh WBS/kategori anggaran ikut terhapus. |
| `projects` | `expense_requests` | `project_id` | **RESTRICT** | Proyek yang sudah memiliki riwayat pengajuan kasbon **dilarang keras** dihapus. |
| `budget_categories` | `budget_items` | `category_id` | **CASCADE** | Sub-item RAB terikat langsung pada kategori WBS induknya. |
| `budget_items` | `expense_request_items`| `budget_item_id`| **RESTRICT** | Pagu akun RAB tidak boleh dihapus jika sedang ada kasbon berjalan/tercatat. |
| `budget_items` | `realization_items` | `budget_item_id`| **RESTRICT** | Akun RAB tidak boleh dihapus jika telah memiliki realisasi faktur belanja. |
| `expense_requests` | `expense_request_items`| `request_id` | **CASCADE** | Item rincian kasbon terhapus bersama berkas pengajuannya jika dibatalkan/dihapus. |
| `expense_requests` | `approval_logs` | `request_id` | **CASCADE** | Log persetujuan melekat pada tiket pengajuan dana. |
| `expense_requests` | `realizations` | `request_id` | **RESTRICT** | Pengajuan dana yang sudah memiliki LPJ/Settlement tidak dapat dihapus sembarangan. |
| `realizations` | `realization_items` | `realization_id`| **CASCADE** | Rincian belanja LPJ mengikuti induk settlement-nya. |
| `realization_items`| `receipt_attachments` | `realization_item_id`| **CASCADE** | Berkas foto/PDF struk terikat langsung pada baris item belanja yang bersangkutan. |
| `vendors` | `realization_items` | `vendor_id` | **SET NULL** | Jika master vendor dinonaktifkan/dihapus, bukti belanja historis tetap sah tersimpan. |

---

### 2.2 Composite Unique Indexes & Check Constraints

1. **Unique Kode Anggaran**:
   - `CONSTRAINT uq_project_category_code UNIQUE (project_id, category_code)`: Mencegah duplikasi kode WBS dalam 1 proyek.
   - `CONSTRAINT uq_category_item_code UNIQUE (category_id, item_code)`: Mencegah duplikasi kode akun biaya dalam kategori yang sama.
2. **Integritas Alur LPJ 1:1**:
   - Kolom `request_id` pada tabel `realizations` memiliki index `UNIQUE`. Satu pengajuan dana kasbon hanya boleh dipertanggungjawabkan melalui **satu** berkas settlement LPJ resmi.
3. **Non-Negative Constraints**:
   - `contract_value >= 0` dan `total_budget >= 0`
   - `quantity >= 0` dan `unit_price >= 0`
   - `actual_qty > 0` dan `actual_unit_price >= 0`
   - `file_size_bytes > 0`
4. **Validasi Tanggal Proyek**:
   - `CONSTRAINT check_project_dates CHECK (end_date >= start_date)`

---

## 3. Skema Pencatatan Otomatis Audit Trail

Untuk memenuhi standar kepatuhan finansial (*financial audit compliance*), sistem menerapkan 2 lapis mekanisme audit:

### 3.1 Otomatisasi Timestamp Mesin (`set_updated_at_timestamp`)
Setiap kali baris data mengalami pembaruan (*UPDATE*), fungsi trigger PostgreSQL langsung menetapkan `updated_at = CURRENT_TIMESTAMP` secara atomik di tingkat basis data, menjamin integritas meskipun data diubah dari luar aplikasi:

```sql
CREATE OR REPLACE FUNCTION set_updated_at_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

Trigger ini diaktifkan secara otomatis pada seluruh tabel yang memiliki atribut `updated_at`:
- `roles`, `users`, `projects`, `budget_categories`, `budget_items`, `expense_requests`, `expense_request_items`, `vendors`, `realizations`, `realization_items`.

### 3.2 Audit Log Snapshot Terpusat (`audit_logs`)
Tabel `audit_logs` merekam snapshot kondisi sebelum dan sesudah perubahan (*diff*) dalam format `JSONB`:
- `id` (UUID PK)
- `user_id` (UUID FK -> users.id, SET NULL jika akun terhapus)
- `action` (CREATE, UPDATE, DELETE, SUBMIT, APPROVE, REJECT, DISBURSE, SETTLE)
- `entity_name` (PROJECT, EXPENSE_REQUEST, REALIZATION, dll.)
- `entity_id` (UUID entitas sasaran)
- `old_values` (JSONB nilai lama)
- `new_values` (JSONB nilai baru)
- `ip_address` & `user_agent`
- `created_at` (TIMESTAMPTZ default now())

---

## 4. Validasi Mock Seed Dataset Proyek Tambun

Seed data menyajikan studi kasus realistis proyek Tambun yang menghubungkan alur kerja antar entitas secara utuh:

### 4.1 Ringkasan Entitas & Volume Baris

| Entitas | Baris | Keterangan & Karakteristik Data |
| :--- | :---: | :--- |
| `roles` | 5 | Seluruh peran sistem (`SUPERADMIN`, `PROJECT_MANAGER`, `SITE_ENGINEER`, `FINANCE`, `DIRECTOR`). |
| `users` | 6 | Ir. Budi Santoso (PM), Eko & Dimas (Site Engineer), Siti Rahma (Finance), Hendra (Direktur), Admin IT. |
| `projects` | 2 | Proyek Gudang & Workshop Tambun (Rp 1,5 Milyar) & Proyek Drainase/Jalan Akses (Rp 750 Juta). |
| `budget_categories` | 5 | WBS-01 (Pondasi), WBS-02 (Struktur), WBS-03 (MEP), WBS-04 (Alat Berat), WBS-05 (Kasbon/K3). |
| `budget_items` | 10 | Semen, Pasir Bangka, Besi D16, Kawat Bendrat, Kayu Bekisting, Pipa PVC, Kabel Supreme, Sewa PC200, Solar Genset, APD K3. |
| `vendors` | 6 | TB Tambun Jaya, PT Baja Perkasa, CV Tambun Rental Alat, SPBU Pertamina Tambun, Depot Pasir, Toko Sinar Terang. |
| `expense_requests` | 5 | Menguji 5 status alur: `SETTLED`, `DISBURSED`, `APPROVED_DIRECTOR` (> 25jt), `SUBMITTED`, dan `DRAFT`. |
| `expense_request_items` | 6 | Rincian kuantitas & estimasi harga satuan per pengajuan kasbon. |
| `approval_logs` | 7 | Audit jejak persetujuan PM -> Finance -> Direktur untuk pengadaan skala besar. |
| `realizations` | 2 | Realisasi 1 (Sisa kasbon kembali Rp 650.000) & Realisasi 2 (Klaim reimburse lebih Rp 400.000). |
| `realization_items` | 4 | Realisasi faktur toko material lengkap dengan nomor faktur, tanggal nota, dan harga nyata. |
| `receipt_attachments` | 5 | Arsip PDF faktur resmi, foto struk nota kontan, dan surat jalan penerimaan barang fisik. |
| `audit_logs` | 6 | Jejak riwayat perubahan status dari draft kasbon hingga penutupan settlement. |

---

### 4.2 Skenario Pengujian Alur yang Tervalidasi

```
+----------------------------------------------------------------------------------------------------+
| SKENARIO 1: Kas Bon Semen & Kawat (REQ-TBN-202604-001)                                              |
| - Pengajuan: Rp 15.000.000 (Diajukan Eko ST, Disetujui PM Budi & Finance Siti)                     |
| - Realisasi Belanja: Rp 14.350.000 (175 zak semen + 100 kg kawat via Toko TB Tambun Jaya)         |
| - Status Akhir: Sisa Kasbon Rp 650.000 disetor kembali ke kas proyek. Status: SETTLED.            |
+----------------------------------------------------------------------------------------------------+

+----------------------------------------------------------------------------------------------------+
| SKENARIO 2: Kas Bon Kayu Bekisting (REQ-TBN-202604-002)                                            |
| - Pengajuan: Rp 8.000.000                                                                         |
| - Realisasi Belanja: Rp 8.400.000 (Kenaikan harga pasar triplek phenolic)                          |
| - Status Akhir: Sisa -Rp 400.000 (Klaim reimbursement kekurangan disetujui Finance).               |
+----------------------------------------------------------------------------------------------------+

+----------------------------------------------------------------------------------------------------+
| SKENARIO 3: Pengadaan Besi Beton D16 (REQ-TBN-202605-001)                                          |
| - Nilai: Rp 48.000.000 (> Batas Threshold Rp 25.000.000)                                           |
| - Alur Validasi: Disetujui PM -> Dievaluasi Direktur Hendra Gunawan -> Disetujui Finance.         |
+----------------------------------------------------------------------------------------------------+
```

---

## 5. Panduan Eksekusi di Lingkungan Database

Untuk mengeksekusi skema dan seed data ini:

```bash
# 1. Masuk ke direktori database
cd packages/database

# 2. Set environment variable koneksi PostgreSQL pada .env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/tambun_db?schema=public"

# 3. Jalankan migrasi schema dan trigger
pnpm prisma:migrate
# atau secara manual via psql:
# psql -U postgres -d tambun_db -f prisma/migrations/20261104000000_init/migration.sql

# 4. Masukkan mock seed data
psql -U postgres -d tambun_db -f prisma/seeds/seed.sql
```
