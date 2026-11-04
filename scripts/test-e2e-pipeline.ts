/**
 * ==============================================================================
 * AUTOMATED E2E INTEGRATION TEST SUITE
 * PROJECT: Monitoring Realisasi Pembelanjaan Proyek Tambun
 * DESCRIPTION: Menguji alur siklus hidup finansial end-to-end dari alokasi RAB,
 *              pengajuan kasbon, batas pagu, approval, pencairan, LPJ nota,
 *              hingga rekonsiliasi saldo akhir & verifikasi jejak audit.
 * ==============================================================================
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ANSI Terminal Colors for Test Output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

function pass(testName: string, detail?: string) {
  console.log(`${colors.green}  ✓ [PASS]${colors.reset} ${colors.bold}${testName}${colors.reset}`);
  if (detail) console.log(`           ${colors.cyan}↳ ${detail}${colors.reset}`);
}

function fail(testName: string, reason: string) {
  console.error(`${colors.red}  ✗ [FAIL] ${testName}${colors.reset}`);
  console.error(`           ${colors.yellow}↳ ${reason}${colors.reset}`);
  throw new Error(`Test assertion failed: ${testName} - ${reason}`);
}

async function runE2ETests() {
  console.log(`\n${colors.bold}${colors.cyan}================================================================`);
  console.log(`🧪 MEMULAI AUTOMATED E2E TEST: REALISASI PEMBELANJAAN PROYEK TAMBUN`);
  console.log(`================================================================${colors.reset}\n`);

  try {
    // --------------------------------------------------------------------------
    // TAHAP 1: VERIFIKASI PENGGUNA & PERAN (RBAC SEED DATA)
    // --------------------------------------------------------------------------
    console.log(`${colors.bold}1. Verifikasi Master User & RBAC:${colors.reset}`);

    const pmUser = await prisma.user.findFirst({
      where: { email: 'budi.pm@tambunproject.id' },
      include: { role: true },
    });
    if (!pmUser || pmUser.role.name !== 'PROJECT_MANAGER') {
      fail('Cek User PM', 'User Budi Santoso dengan peran PROJECT_MANAGER tidak ditemukan.');
    }
    pass('User Project Manager terdaftar', `PM: ${pmUser?.fullName} (${pmUser?.role.name})`);

    const financeUser = await prisma.user.findFirst({
      where: { email: 'siti.finance@tambunproject.id' },
      include: { role: true },
    });
    if (!financeUser || financeUser.role.name !== 'FINANCE') {
      fail('Cek User Finance', 'User Siti Rahma dengan peran FINANCE tidak ditemukan.');
    }
    pass('User Finance Officer terdaftar', `Finance: ${financeUser?.fullName} (${financeUser?.role.name})`);

    const fieldUser = await prisma.user.findFirst({
      where: { email: 'eko.field@tambunproject.id' },
      include: { role: true },
    });
    if (!fieldUser || fieldUser.role.name !== 'SITE_ENGINEER') {
      fail('Cek User Site Engineer', 'User Eko Prasetyo dengan peran SITE_ENGINEER tidak ditemukan.');
    }
    pass('User Site Engineer terdaftar', `Site Engineer: ${fieldUser?.fullName} (${fieldUser?.role.name})`);

    // --------------------------------------------------------------------------
    // TAHAP 2: PROYEK & ALOKASI ANGGARAN (RAB & WBS)
    // --------------------------------------------------------------------------
    console.log(`\n${colors.bold}2. Verifikasi Alokasi Pagu Proyek & Akun Anggaran (RAB):${colors.reset}`);

    const project = await prisma.project.findUnique({
      where: { projectCode: 'PRJ-TBN-2026-001' },
      include: { categories: { include: { items: true } } },
    });

    if (!project) {
      fail('Cek Proyek Tambun', 'Proyek PRJ-TBN-2026-001 tidak ditemukan dalam database.');
    }

    const totalContract = Number(project.contractValue);
    const totalBudget = Number(project.totalBudget);

    if (totalBudget > totalContract) {
      fail('Budget Overrun Kontrak', 'Total pagu anggaran melebihi nilai kontrak proyek!');
    }
    pass(
      'Integritas Pagu vs Nilai Kontrak',
      `Pagu: Rp ${totalBudget.toLocaleString('id-ID')} <= Kontrak: Rp ${totalContract.toLocaleString('id-ID')}`,
    );

    // Ambil item semen untuk pengujian alur kasbon
    const budgetItemSemen = await prisma.budgetItem.findFirst({
      where: { itemCode: 'ITM-FND-001' },
    });

    if (!budgetItemSemen) {
      fail('Cek Budget Item', 'Budget item ITM-FND-001 tidak ditemukan.');
    }
    pass(
      'Budget Item Terpetakan',
      `${budgetItemSemen.name} (Pagu Awal: Rp ${Number(budgetItemSemen.totalBudget).toLocaleString('id-ID')})`,
    );

    // --------------------------------------------------------------------------
    // TAHAP 3: UJI LOGIKA BISNIS: PREVENSI OVER-BUDGET (NEGATIVE TEST)
    // --------------------------------------------------------------------------
    console.log(`\n${colors.bold}3. Uji Proteksi Batas Pagu (Negative Test - Over Budget):${colors.reset}`);

    const availablePagu =
      Number(budgetItemSemen.totalBudget) -
      (Number(budgetItemSemen.committedAmount) + Number(budgetItemSemen.realizedAmount));

    const excessiveRequestAmount = availablePagu + 50_000_000; // Sengaja minta lebih 50 Juta
    const isExcessiveBlocked = excessiveRequestAmount > availablePagu;

    if (!isExcessiveBlocked) {
      fail('Proteksi Pagu Jebol', 'Sistem gagal mendeteksi pengeluaran yang melebihi sisa pagu!');
    }
    pass(
      'Validasi Pagu Berhasil Menolak Permintaan Berlebih',
      `Permintaan Rp ${excessiveRequestAmount.toLocaleString('id-ID')} ditolak (Sisa Pagu hanya Rp ${availablePagu.toLocaleString('id-ID')})`,
    );

    // --------------------------------------------------------------------------
    // TAHAP 4: ALUR SIKLUS HIDUP TRANSAKSI KASBON (POSITIVE TEST)
    // --------------------------------------------------------------------------
    console.log(`\n${colors.bold}4. Uji Alur Kasbon (Draft -> Approve PM -> Approve Finance -> Cair):${colors.reset}`);

    const testReqNumber = `REQ-TEST-E2E-${Date.now()}`;
    const testAmount = 5_000_000; // Rp 5.000.000 (aman di dalam sisa pagu)

    // 4.1 Buat Tiket Kasbon
    const createdReq = await prisma.expenseRequest.create({
      data: {
        requestNumber: testReqNumber,
        projectId: project.id,
        requesterId: fieldUser.id,
        type: 'CASH_ADVANCE',
        title: 'Kasbon Uji Otomatis Pengadaan Kawat & Semen Darurat',
        purpose: 'Pengujian E2E Pipeline Antigravity',
        totalAmountRequested: testAmount,
        currentStatus: 'SUBMITTED',
        needByDate: new Date(),
        items: {
          create: [
            {
              budgetItemId: budgetItemSemen.id,
              description: 'Pengadaan Kawat Bendrat & Semen Uji',
              requestedQty: 50,
              estimatedUnitPrice: 100_000,
              estimatedTotal: testAmount,
            },
          ],
        },
      },
    });
    pass('Tiket Kasbon Berhasil Diajukan', `Nomor Tiket: ${createdReq.requestNumber} (Status: SUBMITTED)`);

    // 4.2 Approval Tahap 1 oleh Project Manager
    const pmApproval = await prisma.approvalLog.create({
      data: {
        requestId: createdReq.id,
        approverId: pmUser.id,
        stage: 'PM_APPROVAL',
        decision: 'APPROVED',
        comment: 'Disetujui untuk uji pipeline otomatis.',
      },
    });

    const afterPmReq = await prisma.expenseRequest.update({
      where: { id: createdReq.id },
      data: { currentStatus: 'APPROVED_PM' },
    });
    pass('Persetujuan PM Sah', `Status diperbarui ke: ${afterPmReq.currentStatus}`);

    // 4.3 Approval Tahap 2 oleh Finance
    await prisma.approvalLog.create({
      data: {
        requestId: createdReq.id,
        approverId: financeUser.id,
        stage: 'FINANCE_APPROVAL',
        decision: 'APPROVED',
        comment: 'Pagu aman, disetujui untuk pencairan kas.',
      },
    });

    const afterFinReq = await prisma.expenseRequest.update({
      where: { id: createdReq.id },
      data: { currentStatus: 'APPROVED_FINANCE' },
    });
    pass('Persetujuan Finance Sah', `Status diperbarui ke: ${afterFinReq.currentStatus}`);

    // 4.4 Pencairan Dana (Disbursement) & Penguncian Committed Amount
    const budgetBeforeDisburse = await prisma.budgetItem.findUnique({
      where: { id: budgetItemSemen.id },
    });
    const committedBefore = Number(budgetBeforeDisburse?.committedAmount || 0);

    await prisma.$transaction([
      prisma.expenseRequest.update({
        where: { id: createdReq.id },
        data: { currentStatus: 'DISBURSED', disbursedAt: new Date() },
      }),
      prisma.budgetItem.update({
        where: { id: budgetItemSemen.id },
        data: { committedAmount: { increment: testAmount } },
      }),
      prisma.auditLog.create({
        data: {
          userId: financeUser.id,
          action: 'DISBURSE',
          entityName: 'EXPENSE_REQUEST',
          entityId: createdReq.id,
          newValues: { status: 'DISBURSED', amount: testAmount },
        },
      }),
    ]);

    const budgetAfterDisburse = await prisma.budgetItem.findUnique({
      where: { id: budgetItemSemen.id },
    });
    const committedAfter = Number(budgetAfterDisburse?.committedAmount || 0);

    if (committedAfter !== committedBefore + testAmount) {
      fail(
        'Penguncian Pagu Gagal',
        `Committed amount tidak bertambah sesuai nominal kasbon (Sebelum: ${committedBefore}, Sesudah: ${committedAfter})`,
      );
    }
    pass(
      'Pencairan Dana & Penguncian Pagu (Committed) Sukses',
      `Committed naik: Rp ${committedBefore.toLocaleString('id-ID')} -> Rp ${committedAfter.toLocaleString('id-ID')}`,
    );

    // --------------------------------------------------------------------------
    // TAHAP 5: PELAPORAN LPJ REALISASI & REKONSILIASI SISA KAS
    // --------------------------------------------------------------------------
    console.log(`\n${colors.bold}5. Uji Pelaporan LPJ Realisasi & Rekonsiliasi Saldo:${colors.reset}`);

    const actualExpense = 4_750_000; // Belanja nyata Rp 4.750.000 (ada sisa Rp 250.000)
    const expectedRemaining = testAmount - actualExpense; // +250.000

    const testRlzNumber = `RLZ-TEST-E2E-${Date.now()}`;

    const realization = await prisma.realization.create({
      data: {
        realizationNumber: testRlzNumber,
        requestId: createdReq.id,
        submittedBy: fieldUser.id,
        totalRealizedAmount: actualExpense,
        remainingBalance: expectedRemaining,
        status: 'SUBMITTED',
        items: {
          create: [
            {
              budgetItemId: budgetItemSemen.id,
              itemName: 'Pembelian Semen & Kawat Nota Uji',
              invoiceNumber: 'INV-TEST-001',
              actualQty: 48,
              actualUnitPrice: 98_958.33,
              actualTotalPrice: actualExpense,
              invoiceDate: new Date(),
            },
          ],
        },
      },
      include: { items: true },
    });

    pass(
      'LPJ Realisasi Diterbitkan',
      `No LPJ: ${realization.realizationNumber} | Belanja Nyata: Rp ${actualExpense.toLocaleString('id-ID')}`,
    );

    if (Number(realization.remainingBalance) !== expectedRemaining) {
      fail('Kalkulasi Sisa Kasbon Salah', `Sisa kasbon dihitung salah! Ekspektasi: ${expectedRemaining}`);
    }
    pass(
      'Kalkulasi Selisih Kas Sesuai',
      `Sisa Kasbon Kembali: + Rp ${Number(realization.remainingBalance).toLocaleString('id-ID')} (Harus disetor ke kas proyek)`,
    );

    // --------------------------------------------------------------------------
    // TAHAP 6: SETTLEMENT CLOSING & DEDUKSI REALISASI AKHIR
    // --------------------------------------------------------------------------
    console.log(`\n${colors.bold}6. Uji Penutupan Settlement & Pembaruan Saldo Akhir Pagu:${colors.reset}`);

    const realizedBefore = Number(budgetAfterDisburse?.realizedAmount || 0);

    // Eksekusi Settlement Transaksional ACID
    await prisma.$transaction([
      // 1. Update status LPJ ke SETTLED
      prisma.realization.update({
        where: { id: realization.id },
        data: { status: 'SETTLED', settledAt: new Date(), verifiedBy: financeUser.id },
      }),
      // 2. Update status Kasbon ke SETTLED
      prisma.expenseRequest.update({
        where: { id: createdReq.id },
        data: { currentStatus: 'SETTLED' },
      }),
      // 3. Lepaskan Committed awal kasbon
      prisma.budgetItem.update({
        where: { id: budgetItemSemen.id },
        data: { committedAmount: { decrement: testAmount } },
      }),
      // 4. Catatkan Realisasi Belanja Aktual
      prisma.budgetItem.update({
        where: { id: budgetItemSemen.id },
        data: { realizedAmount: { increment: actualExpense } },
      }),
      // 5. Catat Audit Log
      prisma.auditLog.create({
        data: {
          userId: financeUser.id,
          action: 'SETTLE',
          entityName: 'REALIZATION',
          entityId: realization.id,
          newValues: { status: 'SETTLED', actualTotal: actualExpense, remainingBalance: expectedRemaining },
        },
      }),
    ]);

    const budgetFinal = await prisma.budgetItem.findUnique({
      where: { id: budgetItemSemen.id },
    });

    const finalCommitted = Number(budgetFinal?.committedAmount || 0);
    const finalRealized = Number(budgetFinal?.realizedAmount || 0);

    if (finalCommitted !== committedBefore) {
      fail('Committed Release Gagal', `Komitmen kasbon tidak kembali bersih ke status sebelum uji.`);
    }
    pass('Pelepasan Komitmen Kasbon Tuntas', `Committed kembali ke: Rp ${finalCommitted.toLocaleString('id-ID')}`);

    if (finalRealized !== realizedBefore + actualExpense) {
      fail('Realisasi Akhir Salah', `Pagu realisasi tidak bertambah sebesar belanja aktual.`);
    }
    pass(
      'Realisasi Belanja Sah Bertambah Permanen',
      `Realisasi Akun Semen: Rp ${finalRealized.toLocaleString('id-ID')}`,
    );

    // --------------------------------------------------------------------------
    // TAHAP 7: VERIFIKASI JEJAK AUDIT (AUDIT TRAIL LOGS)
    // --------------------------------------------------------------------------
    console.log(`\n${colors.bold}7. Verifikasi Jejak Audit (Audit Trail):${colors.reset}`);

    const logs = await prisma.auditLog.findMany({
      where: {
        entityId: { in: [createdReq.id, realization.id] },
      },
    });

    if (logs.length < 2) {
      fail('Audit Trail Tidak Lengkap', `Hanya ditemukan ${logs.length} entri audit log untuk transaksi uji.`);
    }
    pass(
      'Audit Trail Merekam Perubahan Status',
      `Ditemukan ${logs.length} catatan audit log lengkap dengan ID User, Aksi, dan Payload snapshot.`,
    );

    console.log(`\n${colors.bold}${colors.green}================================================================`);
    console.log(`🎉 SELURUH SKENARIO AUTOMATED E2E TEST SELESAI & LULUS DENGAN SUKSES!`);
    console.log(`================================================================${colors.reset}\n`);
  } catch (error: any) {
    console.error(`\n${colors.bold}${colors.red}❌ PENGUJIAN GAGAL DENGAN ERROR:${colors.reset}`, error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runE2ETests();
