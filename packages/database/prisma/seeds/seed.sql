-- ==============================================================================
-- SEED DATA: Mock Dataset untuk Validasi Relasi Entitas & Alur Bisnis
-- PROJECT: Monitoring Realisasi Pembelanjaan Proyek Tambun
-- ==============================================================================

-- 1. SEED ROLES
INSERT INTO "roles" ("id", "name", "description") VALUES
('11111111-1111-1111-1111-111111111101', 'SUPERADMIN', 'Administrator Sistem & Pengelola Master Data'),
('11111111-1111-1111-1111-111111111102', 'PROJECT_MANAGER', 'Kepala Proyek Tambun, Approver Teknis & Kendali RAB'),
('11111111-1111-1111-1111-111111111103', 'SITE_ENGINEER', 'Pelaksana Lapangan, Pengaju Kasbon & Pelapor LPJ'),
('11111111-1111-1111-1111-111111111104', 'FINANCE', 'Finance & Accounting, Verifikator Kwitansi & Kasir'),
('11111111-1111-1111-1111-111111111105', 'DIRECTOR', 'Direktur / Manajemen Eksekutif, Approver Pengeluaran Besar')
ON CONFLICT ("id") DO NOTHING;

-- 2. SEED USERS (Password default hashed: admin123)
-- bcrypt hash $2a$12$K1jE.R3yR6bA1vH3rA/c1e3Ww.7eD6G8t1vC3zY5zB8qV2eT4rS6e
INSERT INTO "users" ("id", "role_id", "full_name", "email", "password_hash", "phone", "is_active") VALUES
('22222222-2222-2222-2222-222222222201', '11111111-1111-1111-1111-111111111101', 'Super Admin IT', 'admin@tambunproject.id', '$2a$12$K1jE.R3yR6bA1vH3rA/c1e3Ww.7eD6G8t1vC3zY5zB8qV2eT4rS6e', '08110000001', true),
('22222222-2222-2222-2222-222222222202', '11111111-1111-1111-1111-111111111102', 'Ir. Budi Santoso, MT', 'budi.pm@tambunproject.id', '$2a$12$K1jE.R3yR6bA1vH3rA/c1e3Ww.7eD6G8t1vC3zY5zB8qV2eT4rS6e', '08121111002', true),
('22222222-2222-2222-2222-222222222203', '11111111-1111-1111-1111-111111111103', 'Eko Prasetyo, ST', 'eko.field@tambunproject.id', '$2a$12$K1jE.R3yR6bA1vH3rA/c1e3Ww.7eD6G8t1vC3zY5zB8qV2eT4rS6e', '08132222003', true),
('22222222-2222-2222-2222-222222222204', '11111111-1111-1111-1111-111111111103', 'Dimas Pratama, AMd', 'dimas.field@tambunproject.id', '$2a$12$K1jE.R3yR6bA1vH3rA/c1e3Ww.7eD6G8t1vC3zY5zB8qV2eT4rS6e', '08133333004', true),
('22222222-2222-2222-2222-222222222205', '11111111-1111-1111-1111-111111111104', 'Siti Rahma, SE, Ak', 'siti.finance@tambunproject.id', '$2a$12$K1jE.R3yR6bA1vH3rA/c1e3Ww.7eD6G8t1vC3zY5zB8qV2eT4rS6e', '08154444005', true),
('22222222-2222-2222-2222-222222222206', '11111111-1111-1111-1111-111111111105', 'Drs. Hendra Gunawan', 'hendra.direksi@tambunproject.id', '$2a$12$K1jE.R3yR6bA1vH3rA/c1e3Ww.7eD6G8t1vC3zY5zB8qV2eT4rS6e', '08115555006', true)
ON CONFLICT ("id") DO NOTHING;

-- 3. SEED PROJECTS
INSERT INTO "projects" ("id", "project_code", "name", "description", "location", "client_name", "contract_value", "total_budget", "start_date", "end_date", "status", "manager_id", "created_by") VALUES
('33333333-3333-3333-3333-333333333301', 'PRJ-TBN-2026-001', 'Pembangunan Gudang & Fasilitas Operasional Tambun', 'Proyek konstruksi gedung pergudangan modern dan fasilitas workshop di Tambun Selatan, Bekasi.', 'Jl. Inspeksi Kalimalang Km. 28, Tambun Selatan, Bekasi', 'PT Logistik Prima Nusantara', 1850000000.00, 1500000000.00, '2026-01-15', '2026-08-31', 'ACTIVE', '22222222-2222-2222-2222-222222222202', '22222222-2222-2222-2222-222222222201'),
('33333333-3333-3333-3333-333333333302', 'PRJ-TBN-2026-002', 'Pekerjaan Saluran Drainase & Rigid Akses Kawasan Tambun', 'Pembangunan jalan akses rigid beton K-350 dan saluran precast U-Ditch 80x80.', 'Kawasan Industri Mitra Tambun, Bekasi Timur', 'PT Mitra Tambun Estate', 920000000.00, 750000000.00, '2026-03-01', '2026-07-31', 'ACTIVE', '22222222-2222-2222-2222-222222222202', '22222222-2222-2222-2222-222222222201')
ON CONFLICT ("id") DO NOTHING;

-- 4. SEED BUDGET CATEGORIES (WBS)
INSERT INTO "budget_categories" ("id", "project_id", "category_code", "name", "allocated_amount", "created_by") VALUES
('44444444-4444-4444-4444-444444444401', '33333333-3333-3333-3333-333333333301', 'WBS-01', 'Pekerjaan Tanah, Galian & Pondasi Tapak', 350000000.00, '22222222-2222-2222-2222-222222222202'),
('44444444-4444-4444-4444-444444444402', '33333333-3333-3333-3333-333333333301', 'WBS-02', 'Pekerjaan Struktur Beton & Rangka Baja', 600000000.00, '22222222-2222-2222-2222-222222222202'),
('44444444-4444-4444-4444-444444444403', '33333333-3333-3333-3333-333333333301', 'WBS-03', 'Instalasi MEP, Listrik Daya & Sanitair', 250000000.00, '22222222-2222-2222-2222-222222222202'),
('44444444-4444-4444-4444-444444444404', '33333333-3333-3333-3333-333333333301', 'WBS-04', 'Sewa Alat Berat & BBM Genset Lapangan', 180000000.00, '22222222-2222-2222-2222-222222222202'),
('44444444-4444-4444-4444-444444444405', '33333333-3333-3333-3333-333333333301', 'WBS-05', 'Biaya Operasional, K3 & Kasbon Lapangan', 120000000.00, '22222222-2222-2222-2222-222222222202')
ON CONFLICT ("id") DO NOTHING;

-- 5. SEED BUDGET ITEMS (RAB DETAIL)
INSERT INTO "budget_items" ("id", "category_id", "item_code", "name", "description", "unit", "quantity", "unit_price", "total_budget", "committed_amount", "realized_amount", "created_by") VALUES
('55555555-5555-5555-5555-555555555501', '44444444-4444-4444-4444-444444444401', 'ITM-FND-001', 'Semen Portland Komposit 50kg', 'Semen struktur untuk sloof & pilecap pondasi', 'ZAK', 1200.00, 68000.00, 81600000.00, 15000000.00, 14350000.00, '22222222-2222-2222-2222-222222222202'),
('55555555-5555-5555-5555-555555555502', '44444444-4444-4444-4444-444444444401', 'ITM-FND-002', 'Pasir Cor Pasang Bangka', 'Pasir kualitas cor bebas lumpur', 'M3', 350.00, 290000.00, 101500000.00, 0.00, 0.00, '22222222-2222-2222-2222-222222222202'),
('55555555-5555-5555-5555-555555555503', '44444444-4444-4444-4444-444444444402', 'ITM-STR-001', 'Besi Beton Ulir D16 BJTS 420B', 'Besi tulangan utama kolom & balok gudang', 'BATANG', 1500.00, 185000.00, 277500000.00, 48000000.00, 0.00, '22222222-2222-2222-2222-222222222202'),
('55555555-5555-5555-5555-555555555504', '44444444-4444-4444-4444-444444444402', 'ITM-STR-002', 'Kawat Bendrat Beton', 'Kawat pengikat rangkaian pembesian tulangan', 'KG', 400.00, 25000.00, 10000000.00, 2500000.00, 2450000.00, '22222222-2222-2222-2222-222222222202'),
('55555555-5555-5555-5555-555555555505', '44444444-4444-4444-4444-444444444402', 'ITM-STR-003', 'Kayu Kaso & Triplek Bekisting 9mm', 'Material bekisting pengecoran kolom', 'LEMBAR', 250.00, 160000.00, 40000000.00, 8000000.00, 8400000.00, '22222222-2222-2222-2222-222222222202'),
('55555555-5555-5555-5555-555555555506', '44444444-4444-4444-4444-444444444403', 'ITM-MEP-001', 'Pipa PVC AW 4 inch Rucika', 'Saluran air bersih dan drainase air hujan', 'BATANG', 120.00, 215000.00, 25800000.00, 0.00, 0.00, '22222222-2222-2222-2222-222222222202'),
('55555555-5555-5555-5555-555555555507', '44444444-4444-4444-4444-444444444403', 'ITM-MEP-002', 'Kabel NYM 3x2.5mm Supreme', 'Kabel instalasi penerangan & stop kontak', 'ROLL', 30.00, 950000.00, 28500000.00, 0.00, 0.00, '22222222-2222-2222-2222-222222222202'),
('55555555-5555-5555-5555-555555555508', '44444444-4444-4444-4444-444444444404', 'ITM-EQP-001', 'Sewa Excavator Komatsu PC200', 'Sewa alat berat galian tanah dan perataan', 'SHIFT', 40.00, 2200000.00, 88000000.00, 11000000.00, 11000000.00, '22222222-2222-2222-2222-222222222202'),
('55555555-5555-5555-5555-555555555509', '44444444-4444-4444-4444-444444444404', 'ITM-EQP-002', 'Solar Industri B35 Non-Subsidi', 'Bahan bakar operasional excavator & genset penerangan malam', 'LITER', 4000.00, 15500.00, 62000000.00, 15500000.00, 0.00, '22222222-2222-2222-2222-222222222202'),
('55555555-5555-5555-5555-555555555510', '44444444-4444-4444-4444-444444444405', 'ITM-OPS-001', 'Perlengkapan K3, Helm & Rompi Lapangan', 'Peralatan keselamatan kerja standar K3', 'PAKET', 30.00, 180000.00, 5400000.00, 5400000.00, 5400000.00, '22222222-2222-2222-2222-222222222202')
ON CONFLICT ("id") DO NOTHING;

-- 6. SEED VENDORS
INSERT INTO "vendors" ("id", "name", "contact_person", "phone", "email", "address", "bank_name", "bank_account_number", "bank_account_holder", "tax_number_npwp", "is_active") VALUES
('66666666-6666-6666-6666-666666666601', 'TB. Tambun Jaya Sentosa', 'Ko Hendra', '021-8833441', 'sales@tambunjaya.co.id', 'Jl. Sultan Hasanudin No. 45, Tambun Selatan, Bekasi', 'BCA', '7310889211', 'TB Tambun Jaya Sentosa', '01.234.567.8-413.000', true),
('66666666-6666-6666-6666-666666666602', 'PT Baja Perkasa Semesta', 'Ibu Maya', '021-8988772', 'order@bajaperkasa.com', 'Kawasan Industri Jababeka 1, Cikarang, Bekasi', 'Mandiri', '1560012399881', 'PT Baja Perkasa Semesta', '02.456.789.0-432.000', true),
('66666666-6666-6666-6666-666666666603', 'CV Tambun Rental Alat Nusantara', 'Pak Joko', '08129998812', 'sewa@tambunrental.id', 'Jl. Raya Setu No. 12, Tambun Selatan, Bekasi', 'BRI', '012901002345501', 'CV Tambun Rental Alat', '03.789.012.3-413.000', true),
('66666666-6666-6666-6666-666666666604', 'SPBU Pertamina 34-17521 Tambun', 'Manager Lapangan', '021-8839001', 'spbu17521@gmail.com', 'Jl. Teuku Umar No. 88, Tambun, Bekasi', 'BNI', '0233445566', 'PT Tambun Migas Utama', '01.999.888.7-413.000', true),
('66666666-6666-6666-6666-666666666605', 'Depot Pasir Mitra Abadi', 'H. Rohim', '08571122334', 'mitraabadi.pasir@gmail.com', 'Kp. Buaran RT 03/02, Lambangsari, Tambun Selatan', 'BSI', '7100882299', 'H. Rohim Depot Pasir', NULL, true),
('66666666-6666-6666-6666-666666666606', 'Toko Listrik & Sanitair Sinar Terang', 'Akiat', '021-8832109', 'sinarterang.tambun@yahoo.com', 'Pasar Tambun Blok B No. 15, Bekasi', 'BCA', '7310554422', 'Toko Sinar Terang', NULL, true)
ON CONFLICT ("id") DO NOTHING;

-- 7. SEED EXPENSE REQUESTS (PENGAJUAN DANA / KAS BON)
INSERT INTO "expense_requests" ("id", "request_number", "project_id", "requester_id", "type", "title", "purpose", "total_amount_requested", "current_status", "need_by_date", "disbursed_at", "notes") VALUES
-- Req 1: Sudah Cair & Sudah LPJ Tuntas (Settled)
('77777777-7777-7777-7777-777777777701', 'REQ-TBN-202604-001', '33333333-3333-3333-3333-333333333301', '22222222-2222-2222-2222-222222222203', 'CASH_ADVANCE', 'Kas Bon Pembelian Semen Batch 1 & Kawat Pengikat', 'Kebutuhan mendesak pengecoran sloof pondasi blok A', 15000000.00, 'SETTLED', '2026-04-10', '2026-04-11 10:30:00+07', 'Transfer via BCA Finance ke Rekening Eko Prasetyo'),

-- Req 2: Sudah Cair & Sedang Verifikasi LPJ (Verified Finance / Selesai Verifikasi Selisih)
('77777777-7777-7777-7777-777777777702', 'REQ-TBN-202604-002', '33333333-3333-3333-3333-333333333301', '22222222-2222-2222-2222-222222222203', 'CASH_ADVANCE', 'Kas Bon Pembelian Kayu Bekisting Kolom Tambun', 'Pengadaan kaso 5/7 dan triplek cor untuk 12 titik kolom', 8000000.00, 'DISBURSED', '2026-04-18', '2026-04-19 14:15:00+07', 'Kasbon dicairkan penuh'),

-- Req 3: Dana Cair, Site Engineer Sedang Belanja di Lapangan
('77777777-7777-7777-7777-777777777703', 'REQ-TBN-202604-003', '33333333-3333-3333-3333-333333333301', '22222222-2222-2222-2222-222222222204', 'CASH_ADVANCE', 'Kas Bon Pengisian Solar Genset & Sewa Excavator 5 Shift', 'Bahan bakar operasional malam dan sewa excavator finishing galian', 15500000.00, 'DISBURSED', '2026-04-25', '2026-04-26 09:00:00+07', 'Pencairan kas bon langsung ke kas operasional'),

-- Req 4: Pengeluaran Besar (> Rp 25jt) Disetujui Direksi & PM, Menunggu Pencairan Finance
('77777777-7777-7777-7777-777777777704', 'REQ-TBN-202605-001', '33333333-3333-3333-3333-333333333301', '22222222-2222-2222-2222-222222222203', 'DIRECT_PURCHASE', 'Pengadaan Besi Beton Ulir D16 (260 Batang)', 'Pengadaan material pembesian rangka portal gudang langsung dari supplier pabrik', 48000000.00, 'APPROVED_DIRECTOR', '2026-05-05', NULL, 'Eskalasi persetujuan Direktur terpenuhi karena nominal > 25 Juta'),

-- Req 5: Draft Pengajuan Baru oleh Site Engineer
('77777777-7777-7777-7777-777777777705', 'REQ-TBN-202605-002', '33333333-3333-3333-3333-333333333301', '22222222-2222-2222-2222-222222222204', 'CASH_ADVANCE', 'Kas Bon Pasir Cor Tambahan 15 M3', 'Tambahan pasir cor pasang untuk plesteran dinding pondasi', 4350000.00, 'DRAFT', '2026-05-10', NULL, 'Sedang menunggu kelengkapan estimasi harga toko')
ON CONFLICT ("id") DO NOTHING;

-- 8. SEED EXPENSE REQUEST ITEMS
INSERT INTO "expense_request_items" ("id", "request_id", "budget_item_id", "description", "requested_qty", "estimated_unit_price", "estimated_total") VALUES
-- Items untuk Req 1
('88888888-8888-8888-8888-888888888801', '77777777-7777-7777-7777-777777777701', '55555555-5555-5555-5555-555555555501', 'Semen Portland Komposit 50kg (180 zak)', 180.00, 68000.00, 12240000.00),
('88888888-8888-8888-8888-888888888802', '77777777-7777-7777-7777-777777777701', '55555555-5555-5555-5555-555555555504', 'Kawat bendrat beton (110 kg)', 110.00, 25000.00, 2760000.00),

-- Items untuk Req 2
('88888888-8888-8888-8888-888888888803', '77777777-7777-7777-7777-777777777702', '55555555-5555-5555-5555-555555555505', 'Kayu kaso 5/7 Meranti & Triplek 9mm 50 lbr', 50.00, 160000.00, 8000000.00),

-- Items untuk Req 3
('88888888-8888-8888-8888-888888888804', '77777777-7777-7777-7777-777777777703', '55555555-5555-5555-5555-555555555509', 'Solar Industri B35 Non Subsidi (1000 Liter)', 1000.00, 15500.00, 15500000.00),

-- Items untuk Req 4
('88888888-8888-8888-8888-888888888805', '77777777-7777-7777-7777-777777777704', '55555555-5555-5555-5555-555555555503', 'Besi Beton Ulir D16 BJTS 420B (260 btg)', 260.00, 184615.38, 48000000.00),

-- Items untuk Req 5
('88888888-8888-8888-8888-888888888806', '77777777-7777-7777-7777-777777777705', '55555555-5555-5555-5555-555555555502', 'Pasir cor pasang Bangka (15 m3)', 15.00, 290000.00, 4350000.00)
ON CONFLICT ("id") DO NOTHING;

-- 9. SEED APPROVAL LOGS (AUDIT TRAIL APPROVAL)
INSERT INTO "approval_logs" ("id", "request_id", "approver_id", "stage", "decision", "comment", "decided_at") VALUES
-- Log untuk Req 1
('99999999-9999-9999-9999-999999999901', '77777777-7777-7777-7777-777777777701', '22222222-2222-2222-2222-222222222202', 'PM_APPROVAL', 'APPROVED', 'Disetujui, volume semen dan kawat sesuai schedule cor minggu ke-2.', '2026-04-10 14:00:00+07'),
('99999999-9999-9999-9999-999999999902', '77777777-7777-7777-7777-777777777701', '22222222-2222-2222-2222-222222222205', 'FINANCE_APPROVAL', 'APPROVED', 'Pagu kasbon tersedia, ditransfer ke rekening Bpk Eko Prasetyo.', '2026-04-11 10:15:00+07'),

-- Log untuk Req 2
('99999999-9999-9999-9999-999999999903', '77777777-7777-7777-7777-777777777702', '22222222-2222-2222-2222-222222222202', 'PM_APPROVAL', 'APPROVED', 'Disetujui untuk bekisting kolom.', '2026-04-18 16:30:00+07'),
('99999999-9999-9999-9999-999999999904', '77777777-7777-7777-7777-777777777702', '22222222-2222-2222-2222-222222222205', 'FINANCE_APPROVAL', 'APPROVED', 'Dana kasbon dicairkan.', '2026-04-19 14:00:00+07'),

-- Log untuk Req 4 (Eskalasi > 25 Juta)
('99999999-9999-9999-9999-999999999905', '77777777-7777-7777-7777-777777777704', '22222222-2222-2222-2222-222222222202', 'PM_APPROVAL', 'APPROVED', 'Spesifikasi teknis BJTS 420B sesuai RKS gambar kerja.', '2026-05-01 11:20:00+07'),
('99999999-9999-9999-9999-999999999906', '77777777-7777-7777-7777-777777777704', '22222222-2222-2222-2222-222222222206', 'DIRECTOR_APPROVAL', 'APPROVED', 'Pengadaan disetujui, pastikan mill certificate baja dilampirkan.', '2026-05-02 09:45:00+07'),
('99999999-9999-9999-9999-999999999907', '77777777-7777-7777-7777-777777777704', '22222222-2222-2222-2222-222222222205', 'FINANCE_APPROVAL', 'APPROVED', 'Jadwal pembayaran tempo 14 hari disiapkan.', '2026-05-02 15:30:00+07')
ON CONFLICT ("id") DO NOTHING;

-- 10. SEED REALIZATIONS (LPJ / SETTLEMENT)
INSERT INTO "realizations" ("id", "realization_number", "request_id", "submitted_by", "total_realized_amount", "remaining_balance", "status", "verified_by", "verified_at", "settled_at", "notes") VALUES
-- Kasus 1: Sisa Kasbon Lebih (Kembali Rp 650.000 ke kas proyek) -> Selesai Settled
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa01', 'RLZ-TBN-202604-001', '77777777-7777-7777-7777-777777777701', '22222222-2222-2222-2222-222222222203', 14350000.00, 650000.00, 'SETTLED', '22222222-2222-2222-2222-222222222205', '2026-04-15 11:00:00+07', '2026-04-15 15:00:00+07', 'Sisa uang kas bon Rp 650.000 telah ditransfer kembali ke rekening penampung proyek. LPJ ditutup.'),

-- Kasus 2: Realisasi Lebih Besar (Klaim Reimburse Rp 400.000 karena harga triplek naik) -> Terverifikasi
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa02', 'RLZ-TBN-202604-002', '77777777-7777-7777-7777-777777777702', '22222222-2222-2222-2222-222222222203', 8400000.00, -400000.00, 'VERIFIED_FINANCE', '22222222-2222-2222-2222-222222222205', '2026-04-22 16:30:00+07', NULL, 'Bukti nota toko terverifikasi sah. Kelebihan belanja Rp 400.000 dijadwalkan reimburse ke Pak Eko.')
ON CONFLICT ("id") DO NOTHING;

-- 11. SEED REALIZATION ITEMS (DETAIL BELANJA NYATA & NOTA)
INSERT INTO "realization_items" ("id", "realization_id", "budget_item_id", "vendor_id", "invoice_number", "item_name", "description", "actual_qty", "actual_unit_price", "actual_total_price", "invoice_date", "notes") VALUES
-- Items untuk Realisasi 1 (Semen & Kawat)
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb01', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa01', '55555555-5555-5555-5555-555555555501', '66666666-6666-6666-6666-666666666601', 'INV-TJ-202604-089', 'Semen PCC Padang 50kg', 'Pembelian 175 zak (diskon volume dari toko)', 175.00, 68000.00, 11900000.00, '2026-04-12', 'Barang diterima lengkap di gudang Tambun'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb02', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa01', '55555555-5555-5555-5555-555555555504', '66666666-6666-6666-6666-666666666601', 'INV-TJ-202604-090', 'Kawat Bendrat Hitam BWG 21', 'Pembelian 100 kg kawat pengikat tulangan', 100.00, 24500.00, 2450000.00, '2026-04-12', 'Kawat bendrat rol 25kg x 4 rol'),

-- Items untuk Realisasi 2 (Bekisting)
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb03', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa02', '55555555-5555-5555-5555-555555555505', '66666666-6666-6666-6666-666666666601', 'INV-TJ-202604-142', 'Kayu Kaso 5/7 x 4m Meranti', 'Kayu penyangga bekisting 50 batang', 50.00, 72000.00, 3600000.00, '2026-04-20', 'Kaso kualitas lurus'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb04', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa02', '55555555-5555-5555-5555-555555555505', '66666666-6666-6666-6666-666666666601', 'INV-TJ-202604-143', 'Triplek Cor Phenolic 9mm', 'Triplek bekisting 30 lembar (ada kenaikan harga Rp 8.000/lbr)', 30.00, 160000.00, 4800000.00, '2026-04-20', 'Triplek lapis resin tahan air')
ON CONFLICT ("id") DO NOTHING;

-- 12. SEED RECEIPT ATTACHMENTS (BUKTI FISIK STRUK / KWITANSI)
INSERT INTO "receipt_attachments" ("id", "realization_item_id", "file_name", "file_key", "file_url", "file_size_bytes", "mime_type", "checksum_sha256") VALUES
('cccccccc-cccc-cccc-cccc-cccccccccc01', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb01', 'Faktur_Semen_TB_TambunJaya_089.pdf', 'receipts/2026/04/prj-001/faktur-semen-089.pdf', 'https://storage.tambunproject.id/receipts/2026/04/prj-001/faktur-semen-089.pdf', 845210, 'application/pdf', 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'),
('cccccccc-cccc-cccc-cccc-cccccccccc02', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb01', 'Surat_Jalan_Semen_175zak.jpg', 'receipts/2026/04/prj-001/sj-semen-175zak.jpg', 'https://storage.tambunproject.id/receipts/2026/04/prj-001/sj-semen-175zak.jpg', 1245800, 'image/jpeg', 'ca978112ca1bbdcafac231b39a23dc4da786eff8147c4e72b9807785afee48bb'),
('cccccccc-cccc-cccc-cccc-cccccccccc03', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb02', 'Kwitansi_Kawat_Bendrat_090.jpg', 'receipts/2026/04/prj-001/kwitansi-kawat-090.jpg', 'https://storage.tambunproject.id/receipts/2026/04/prj-001/kwitansi-kawat-090.jpg', 654210, 'image/jpeg', '3e23e8160039594a33894f6564e1b1348bbd7a0088d42c4acb73eeaed59c009d'),
('cccccccc-cccc-cccc-cccc-cccccccccc04', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb03', 'Nota_Kontan_Kayu_Kaso_142.jpg', 'receipts/2026/04/prj-001/nota-kayu-kaso-142.jpg', 'https://storage.tambunproject.id/receipts/2026/04/prj-001/nota-kayu-kaso-142.jpg', 789120, 'image/jpeg', '2e7d2c03a9507ae265ecf5b5356885a53393a2029d241394997265b4f09d52c6'),
('cccccccc-cccc-cccc-cccc-cccccccccc05', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb04', 'Nota_Triplek_Cor_143.pdf', 'receipts/2026/04/prj-001/nota-triplek-cor-143.pdf', 'https://storage.tambunproject.id/receipts/2026/04/prj-001/nota-triplek-cor-143.pdf', 542110, 'application/pdf', '18ac3e7343f016890c510e93f935261169d9e3f565436429830faf0934f4f8e4')
ON CONFLICT ("id") DO NOTHING;

-- 13. SEED AUDIT LOGS (RIWAYAT TRANSAKSI TERPUSAT)
INSERT INTO "audit_logs" ("id", "user_id", "action", "entity_name", "entity_id", "old_values", "new_values", "ip_address", "user_agent") VALUES
('dddddddd-dddd-dddd-dddd-dddddddddd01', '22222222-2222-2222-2222-222222222201', 'CREATE', 'PROJECT', '33333333-3333-3333-3333-333333333301', NULL, '{"project_code": "PRJ-TBN-2026-001", "total_budget": 1500000000}', '192.168.1.10', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'),
('dddddddd-dddd-dddd-dddd-dddddddddd02', '22222222-2222-2222-2222-222222222203', 'CREATE', 'EXPENSE_REQUEST', '77777777-7777-7777-7777-777777777701', NULL, '{"request_number": "REQ-TBN-202604-001", "amount": 15000000}', '192.168.1.45', 'Mozilla/5.0 (Android 14; Mobile; rv:124.0)'),
('dddddddd-dddd-dddd-dddd-dddddddddd03', '22222222-2222-2222-2222-222222222202', 'APPROVE', 'EXPENSE_REQUEST', '77777777-7777-7777-7777-777777777701', '{"status": "SUBMITTED"}', '{"status": "APPROVED_PM"}', '192.168.1.22', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'),
('dddddddd-dddd-dddd-dddd-dddddddddd04', '22222222-2222-2222-2222-222222222205', 'DISBURSE', 'EXPENSE_REQUEST', '77777777-7777-7777-7777-777777777701', '{"status": "APPROVED_PM"}', '{"status": "DISBURSED", "disbursed_at": "2026-04-11T10:30:00Z"}', '192.168.1.30', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'),
('dddddddd-dddd-dddd-dddd-dddddddddd05', '22222222-2222-2222-2222-222222222203', 'SUBMIT', 'REALIZATION', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa01', NULL, '{"realization_number": "RLZ-TBN-202604-001", "total_realized": 14350000, "remaining_balance": 650000}', '192.168.1.45', 'Mozilla/5.0 (Android 14; Mobile; rv:124.0)'),
('dddddddd-dddd-dddd-dddd-dddddddddd06', '22222222-2222-2222-2222-222222222205', 'SETTLE', 'REALIZATION', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa01', '{"status": "SUBMITTED"}', '{"status": "SETTLED", "notes": "Sisa Rp 650.000 disetor ke kas proyek"}', '192.168.1.30', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)')
ON CONFLICT ("id") DO NOTHING;
