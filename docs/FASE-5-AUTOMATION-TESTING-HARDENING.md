# FASE 5: AUTOMATION, AUDIT TRAIL & SYSTEM HARDENING
## Sistem Monitoring Pembelanjaan Proyek (Realisasi Dana Proyek Tambun)

---

## 1. Executive Summary

Fase 5 melengkapi ekosistem aplikasi agar bersifat **mandiri**, **teruji secara otomatis (*fully tested*)**, dan **siap dijalankan dalam lingkungan produksi (*production hardened*)**. Tiga pilar utama implementasi Fase 5 mencakup:
1. **Sistem Notifikasi & Trigger Otomatis**: Layanan deteksi dini penipisan pagu anggaran (level *Warning* $\le 15\%$, *Critical* $\le 5\%$, dan *Overrun*) serta antrean disposisi kasbon otomatis (PM, Direksi, dan Finance).
2. **Automated E2E Testing Suite**: Skrip pengujian terintegrasi penuh yang menguji 7 tahap siklus hidup finansial: dari pemetaan pagu RAB awal, uji kegagalan belanja melebihi pagu (*negative test*), persetujuan multi-level, pencairan kasbon, penerbitan LPJ nota nyata, kalkulasi pengembalian sisa kas, penutupan *settlement*, hingga validasi jejak audit.
3. **Container Orchestration & One-Click Deployment**: Penyiapan lingkungan terisolasi dengan Docker Compose (PostgreSQL 16, MinIO S3 Object Storage, NestJS API Core, dan Next.js Web Dashboard) yang dapat dijalankan melalui satu perintah skrip peluncur (*launcher script*).

Berkas sumber daya telah disimpan pada:
- **Layanan Notifikasi Otomatis**: [`apps/api/src/modules/notifications/notifications.service.ts`](file:///c:/Users/Swanto/OneDrive/Desktop/REALISASI%20DANA%20PROJECT%20TAMBUN/apps/api/src/modules/notifications/notifications.service.ts)
- **Skrip E2E Integration Test**: [`scripts/test-e2e-pipeline.ts`](file:///c:/Users/Swanto/OneDrive/Desktop/REALISASI%20DANA%20PROJECT%20TAMBUN/scripts/test-e2e-pipeline.ts)
- **Docker Compose Orchestrator**: [`docker-compose.yml`](file:///c:/Users/Swanto/OneDrive/Desktop/REALISASI%20DANA%20PROJECT%20TAMBUN/docker-compose.yml)
- **Backend Multi-stage Dockerfile**: [`apps/api/Dockerfile`](file:///c:/Users/Swanto/OneDrive/Desktop/REALISASI%20DANA%20PROJECT%20TAMBUN/apps/api/Dockerfile)
- **Frontend Multi-stage Dockerfile**: [`apps/web/Dockerfile`](file:///c:/Users/Swanto/OneDrive/Desktop/REALISASI%20DANA%20PROJECT%20TAMBUN/apps/web/Dockerfile)
- **Peluncur Satu Perintah Windows**: [`run-app.bat`](file:///c:/Users/Swanto/OneDrive/Desktop/REALISASI%20DANA%20PROJECT%20TAMBUN/run-app.bat)
- **Peluncur Satu Perintah Linux/Mac**: [`run-app.sh`](file:///c:/Users/Swanto/OneDrive/Desktop/REALISASI%20DANA%20PROJECT%20TAMBUN/run-app.sh)
- **Peluncur PowerShell**: [`scripts/dev.ps1`](file:///c:/Users/Swanto/OneDrive/Desktop/REALISASI%20DANA%20PROJECT%20TAMBUN/scripts/dev.ps1)

---

## 2. Sistem Notifikasi & Trigger Otomatis

Modul [`NotificationsModule`](file:///c:/Users/Swanto/OneDrive/Desktop/REALISASI%20DANA%20PROJECT%20TAMBUN/apps/api/src/modules/notifications/notifications.module.ts) memonitor status transaksi dan kesehatan pagu secara berkala melalui dua trigger utama:

```
+----------------------------------------------------------------------------------------------------+
| TRIGGER 1: MONITORING PENIPISAN PAGU ANGGARAN (BUDGET DEPLETION ALERT)                             |
+----------------------------------------------------------------------------------------------------+
|  • LEVEL WARNING  : Sisa pagu <= 15% dari total anggaran akun RAB.                                 |
|  • LEVEL CRITICAL : Sisa pagu <= 5% dari total anggaran akun RAB.                                  |
|  • LEVEL OVERRUN  : Sisa pagu < Rp 0 (Pengeluaran aktual + komitmen kasbon melampaui pagu RAB).    |
|  Aksi: Memunculkan badge peringatan pada dashboard eksekutif dan mengunci pembuatan kasbon baru.   |
+----------------------------------------------------------------------------------------------------+

+----------------------------------------------------------------------------------------------------+
| TRIGGER 2: DISPOSISI PERSETUJUAN TIKET KASBON (PENDING APPROVAL NOTIFICATION)                      |
+----------------------------------------------------------------------------------------------------+
|  • Tiket SUBMITTED          -> Disposisi ke inbox Project Manager (Ir. Budi Santoso).              |
|  • Tiket > Rp 25 Juta       -> Eskalasi otomatis ke Direktur (Drs. Hendra Gunawan).                |
|  • Tiket APPROVED_PM/DIR    -> Disposisi ke kasir Finance (Siti Rahma) untuk proses transfer bank. |
|  • Tiket DISBURSED > 7 hari -> Peringatan Site Engineer untuk segera melampirkan LPJ nota belanja.|
+----------------------------------------------------------------------------------------------------+
```

---

## 3. Automated End-to-End Testing Suite

Pengujian menyeluruh diimplementasikan dalam berkas [`scripts/test-e2e-pipeline.ts`](file:///c:/Users/Swanto/OneDrive/Desktop/REALISASI%20DANA%20PROJECT%20TAMBUN/scripts/test-e2e-pipeline.ts). Skrip ini memverifikasi seluruh rantai integritas sistem dengan urutan pengujian sebagai berikut:

```
+-------------------------------------------------------------------------------------+
|                     ALUR PENGUJIAN OTOMATIS PIPELINE E2E                            |
+-------------------------------------------------------------------------------------+
| [TAHAP 1] Verifikasi Master User & RBAC:                                            |
|           Memeriksa ketersediaan akun PM, Finance, dan Site Engineer di database.   |
|                                                                                     |
| [TAHAP 2] Integritas Pagu RAB vs Kontrak Proyek:                                    |
|           Memastikan total pagu WBS (Rp 1.5 M) <= nilai kontrak (Rp 1.85 M).        |
|                                                                                     |
| [TAHAP 3] Proteksi Batas Pagu (Negative Test):                                      |
|           Menyimulasikan pengajuan belanja melebihi sisa pagu dan memastikan sistem|
|           menolaknya secara preventif.                                              |
|                                                                                     |
| [TAHAP 4] Siklus Kasbon Positif (Positive Test):                                    |
|           • Buat tiket kasbon Rp 5.000.000 (Status: SUBMITTED).                     |
|           • Approval PM -> Approval Finance -> Pencairan Dana (DISBURSED).          |
|           • Verifikasi: Pagu terkunci otomatis (committedAmount bertambah 5 Juta).   |
|                                                                                     |
| [TAHAP 5] Pelaporan LPJ Realisasi & Kwitansi:                                       |
|           • Laporkan nota riil sebesar Rp 4.750.000.                                |
|           • Verifikasi: Sisa kasbon kembali dihitung tepat (+ Rp 250.000).          |
|                                                                                     |
| [TAHAP 6] Settlement Closing & Rekonsiliasi Akhir:                                  |
|           • Transaksi ACID: Status ditutup (SETTLED).                               |
|           • committedAmount kasbon awal dilepaskan (- Rp 5.000.000).                |
|           • realizedAmount diperbarui permanen (+ Rp 4.750.000).                    |
|                                                                                     |
| [TAHAP 7] Verifikasi Jejak Audit (Audit Trail):                                     |
|           Memastikan seluruh mutasi terekam lengkap pada tabel audit_logs.          |
+-------------------------------------------------------------------------------------+
```

### Cara Menjalankan Automated Test:
```bash
# Jalankan test suite terintegrasi
pnpm test:e2e
# atau
npx ts-node scripts/test-e2e-pipeline.ts
```

---

## 4. Container Deployment & One-Click Execution

Arsitektur aplikasi dikemas ke dalam kontainer mandiri berbasis **Docker Compose** yang mengoordinasikan 4 layanan utama:

```
                                  [ DOCKER COMPOSE ]
                                           |
         +-----------------+---------------+---------------+-----------------+
         |                 |                               |                 |
         v                 v                               v                 v
+-----------------+ +-----------------+             +-----------------+ +-----------------+
|   POSTGRESQL    | |    MINIO S3     |             |   NESTJS API    | |   NEXT.JS WEB   |
|   Version 16    | | Object Storage  |             |  Backend Core   | |  Dashboard UI   |
|   Port: 5432    | | Ports: 9000/9001|             |   Port: 4000    | |   Port: 3000    |
+-----------------+ +-----------------+             +-----------------+ +-----------------+
```

### 4.1 Menjalankan Aplikasi Melalui Satu Perintah

#### Pada Lingkungan Windows:
Cukup klik ganda atau jalankan melalui terminal:
```cmd
run-app.bat
```
*Atau gunakan PowerShell:*
```powershell
.\scripts\dev.ps1
```

#### Pada Lingkungan Linux / macOS:
```bash
chmod +x run-app.sh
./run-app.sh
```

---

### 4.2 Alamat Layanan & Akses Jaringan Lokal

| Layanan | URL Akses | Kredensial Default |
| :--- | :--- | :--- |
| **Frontend Web Dashboard** | `http://localhost:3000` | - |
| **Backend REST API** | `http://localhost:4000/api/v1` | Bearer JWT Token |
| **Swagger OpenAPI Documentation** | `http://localhost:4000/api/docs` | Dokumentasi Interaktif |
| **MinIO Storage Console** | `http://localhost:9001` | User: `minioadmin`, Pass: `minioadmin` |
| **PostgreSQL Database** | `localhost:5432` | DB: `tambun_db`, User: `postgres`, Pass: `postgres` |

---

## 5. Ringkasan Kematangan Sistem (System Maturity Matrix)

| Fase Pengembangan | Capaian | Status |
| :--- | :--- | :---: |
| **Fase 1: Architecture Blueprint** | Rekomendasi Tech Stack, ERD Blueprint, Matriks RBAC, Struktur Monorepo. | ✅ Disetujui |
| **Fase 2: Database & Migrations** | 13 Entitas, DDL SQL, Trigger updated_at, Constraints, Mock Seed Data. | ✅ Selesai |
| **Fase 3: Backend API Core** | NestJS Modular Engine, JWT, RBAC Guards, Validasi Pagu, Alur Approval. | ✅ Selesai |
| **Fase 4: Frontend Dashboard** | Next.js 14, Data Table Dinamis, Form Kasbon & LPJ, Overrun Warning. | ✅ Selesai |
| **Fase 5: Automation & Hardening** | Trigger Notifikasi, Skrip Automated E2E Test, Docker Compose One-Click. | ✅ Selesai |
