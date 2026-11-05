/**
 * ==============================================================================
 * UNIFIED RUNNER: Realisasi Dana Project Tambun
 * DESCRIPTION: Menjalankan ekosistem aplikasi secara utuh dalam satu server mandiri.
 *              Menyajikan REST API Core Engine dan Frontend Interactive Dashboard
 *              pada port tunggal tanpa ketergantungan eksternal.
 * ==============================================================================
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 3000;
const DB_PATH = path.join(__dirname, 'data', 'db.json');
const PUBLIC_HTML_PATH = path.join(__dirname, 'public', 'index.html');

// Helper to read and write database state
function readDb() {
  try {
    const raw = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading db.json:', err);
    return { projects: [], categories: [], budgetItems: [], requests: [], realizations: [], auditLogs: [] };
  }
}

function writeDb(data) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing to db.json:', err);
  }
}

// JSON Parser helper
function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        resolve({});
      }
    });
    req.on('error', reject);
  });
}

// Send standard JSON response
function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  });
  res.end(JSON.stringify(data));
}

const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const method = req.method;

  // Handle CORS Preflight
  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    });
    return res.end();
  }

  // --------------------------------------------------------------------------
  // 1. FRONTEND DASHBOARD ROUTE (GET /)
  // --------------------------------------------------------------------------
  if (method === 'GET' && (pathname === '/' || pathname === '/index.html')) {
    if (fs.existsSync(PUBLIC_HTML_PATH)) {
      const html = fs.readFileSync(PUBLIC_HTML_PATH, 'utf-8');
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      return res.end(html);
    }
  }

  // --------------------------------------------------------------------------
  // 2. REST API ROUTES
  // --------------------------------------------------------------------------

  // GET /api/v1/data (All State)
  if (method === 'GET' && pathname === '/api/v1/data') {
    const db = readDb();
    return sendJson(res, 200, db);
  }

  // GET /api/v1/projects
  if (method === 'GET' && pathname === '/api/v1/projects') {
    const db = readDb();
    return sendJson(res, 200, { success: true, data: db.projects });
  }

  // PUT / POST /api/v1/categories/budget (Batch Update Budget Values)
  if ((method === 'PUT' || method === 'POST') && pathname === '/api/v1/categories/budget') {
    const db = readDb();
    const payload = await parseBody(req);

    if (payload.categories && Array.isArray(payload.categories)) {
      payload.categories.forEach(item => {
        const cat = db.categories.find(c => c.id === item.id);
        if (cat) {
          if (item.allocatedAmount !== undefined) cat.allocatedAmount = Number(item.allocatedAmount);
          if (item.name) cat.name = item.name;
        }
      });
    }

    if (payload.totalBudget !== undefined && db.projects[0]) {
      db.projects[0].totalBudget = Number(payload.totalBudget);
    } else if (db.projects[0]) {
      db.projects[0].totalBudget = db.categories.reduce((s, c) => s + Number(c.allocatedAmount || 0), 0);
    }

    db.auditLogs.unshift({
      id: String(Date.now()),
      userName: 'Manajemen Eksekutif',
      action: 'APPROVE',
      entityName: 'BUDGET_ADJUSTMENT',
      ticket: 'ADJ-BUDGET-' + Date.now().toString().slice(-4),
      detail: 'Penyesuaian nilai pagu anggaran berhasil disimpan (Total Rp ' + Number(db.projects[0]?.totalBudget || 0).toLocaleString('id-ID') + ')',
      timestamp: new Date().toISOString()
    });

    writeDb(db);
    return sendJson(res, 200, { success: true, message: 'Nilai budget berhasil diperbarui.', data: db });
  }

  // GET /api/v1/requests
  if (method === 'GET' && pathname === '/api/v1/requests') {
    const db = readDb();
    return sendJson(res, 200, { success: true, data: db.requests });
  }

  // POST /api/v1/requests (Create Kasbon with Budget Ceiling Validation)
  if (method === 'POST' && pathname === '/api/v1/requests') {
    const db = readDb();
    const payload = await parseBody(req);

    const budgetItem = db.budgetItems.find(i => i.id === payload.items?.[0]?.budgetItemId);
    if (!budgetItem) {
      return sendJson(res, 400, { success: false, message: 'Budget item tidak ditemukan.' });
    }

    const requestedAmount = Number(payload.totalAmountRequested || 0);
    const availablePagu = Number(budgetItem.totalBudget) - (Number(budgetItem.committedAmount || 0) + Number(budgetItem.realizedAmount || 0));

    if (requestedAmount > availablePagu) {
      return sendJson(res, 400, {
        success: false,
        message: `Pengajuan Rp ${requestedAmount.toLocaleString('id-ID')} melebihi sisa pagu tersedia (Rp ${availablePagu.toLocaleString('id-ID')})!`
      });
    }

    const newNumber = `REQ-TBN-202605-${String(db.requests.length + 1).padStart(3, '0')}`;
    const newReq = {
      id: `req-${Date.now()}`,
      requestNumber: newNumber,
      projectId: payload.projectId || db.projects[0].id,
      projectName: 'Pembangunan Gudang Tambun',
      requesterName: 'Eko Prasetyo, ST (Lapangan)',
      type: payload.type || 'CASH_ADVANCE',
      title: payload.title,
      purpose: payload.purpose,
      totalAmountRequested: requestedAmount,
      currentStatus: 'SUBMITTED',
      needByDate: payload.needByDate || new Date().toISOString().slice(0, 10),
      items: payload.items || []
    };

    db.requests.unshift(newReq);
    db.auditLogs.unshift({
      id: String(Date.now()),
      userName: 'Eko Prasetyo, ST',
      action: 'SUBMIT',
      entityName: 'EXPENSE_REQUEST',
      ticket: newNumber,
      detail: `Pengajuan kasbon ${payload.title} senilai Rp ${requestedAmount.toLocaleString('id-ID')}`,
      timestamp: new Date().toISOString()
    });

    writeDb(db);
    return sendJson(res, 201, { success: true, message: 'Pengajuan kasbon berhasil disimpan.', data: newReq });
  }

  // POST /api/v1/requests/:id/approve
  if (method === 'POST' && pathname.startsWith('/api/v1/requests/') && pathname.endsWith('/approve')) {
    const id = pathname.split('/')[4];
    const db = readDb();
    const reqItem = db.requests.find(r => r.id === id);

    if (!reqItem) {
      return sendJson(res, 404, { success: false, message: 'Tiket kasbon tidak ditemukan.' });
    }

    const amount = Number(reqItem.totalAmountRequested);
    let nextStatus = 'APPROVED_PM';
    if (amount > 25000000) {
      nextStatus = 'APPROVED_DIRECTOR';
    } else {
      nextStatus = 'APPROVED_FINANCE';
    }

    reqItem.currentStatus = nextStatus;
    db.auditLogs.unshift({
      id: String(Date.now()),
      userName: 'Ir. Budi Santoso, MT (PM)',
      action: 'APPROVE',
      entityName: 'EXPENSE_REQUEST',
      ticket: reqItem.requestNumber,
      detail: `Kasbon disetujui, diteruskan ke ${nextStatus}`,
      timestamp: new Date().toISOString()
    });

    writeDb(db);
    return sendJson(res, 200, { success: true, message: 'Persetujuan dicatat.', data: reqItem });
  }

  // POST /api/v1/requests/:id/disburse
  if (method === 'POST' && pathname.startsWith('/api/v1/requests/') && pathname.endsWith('/disburse')) {
    const id = pathname.split('/')[4];
    const db = readDb();
    const reqItem = db.requests.find(r => r.id === id);

    if (!reqItem) {
      return sendJson(res, 404, { success: false, message: 'Tiket kasbon tidak ditemukan.' });
    }

    reqItem.currentStatus = 'DISBURSED';
    reqItem.disbursedAt = new Date().toISOString();

    // Lock committed amount on budget item
    const budgetItemId = reqItem.items?.[0]?.budgetItemId;
    if (budgetItemId) {
      const bItem = db.budgetItems.find(i => i.id === budgetItemId);
      if (bItem) {
        bItem.committedAmount = Number(bItem.committedAmount || 0) + Number(reqItem.totalAmountRequested);
      }
    }

    db.auditLogs.unshift({
      id: String(Date.now()),
      userName: 'Siti Rahma, SE (Finance)',
      action: 'DISBURSE',
      entityName: 'EXPENSE_REQUEST',
      ticket: reqItem.requestNumber,
      detail: `Kasbon dicairkan & pagu komitmen dikunci (Rp ${Number(reqItem.totalAmountRequested).toLocaleString('id-ID')})`,
      timestamp: new Date().toISOString()
    });

    writeDb(db);
    return sendJson(res, 200, { success: true, message: 'Dana berhasil dicairkan.', data: reqItem });
  }

  // GET /api/v1/realizations
  if (method === 'GET' && pathname === '/api/v1/realizations') {
    const db = readDb();
    return sendJson(res, 200, { success: true, data: db.realizations });
  }

  // POST /api/v1/realizations (Submit LPJ)
  if (method === 'POST' && pathname === '/api/v1/realizations') {
    const db = readDb();
    const payload = await parseBody(req);
    const targetReq = payload.requestId ? db.requests.find(r => r.id === payload.requestId) : null;

    let requestedAmt = 0;
    let targetTitle = payload.itemName || 'Pembelian Riil Lapangan';
    let reqNumber = '-';
    let reqId = null;
    let cat = null;

    if (targetReq) {
      requestedAmt = Number(targetReq.totalAmountRequested || 0);
      targetTitle = targetReq.title;
      reqNumber = targetReq.requestNumber;
      reqId = targetReq.id;
      targetReq.currentStatus = 'SETTLED';
      const bItemId = targetReq.items?.[0]?.budgetItemId;
      const bItem = db.budgetItems.find(i => i.id === bItemId);
      cat = db.categories.find(c => c.id === bItem?.categoryId) || db.categories.find(c => c.id === targetReq.categoryId);
    }

    if (!cat && payload.categoryId) {
      cat = db.categories.find(c => c.id === payload.categoryId);
    }
    if (!cat) {
      cat = db.categories[0];
    }

    const actualAmt = Number(payload.actualTotalPrice || 0);
    const remaining = requestedAmt - actualAmt;
    const newRlzNumber = 'RLZ-TBN-202605-' + String(db.realizations.length + 1).padStart(3, '0');

    const newRlz = {
      id: 'rlz-' + Date.now(),
      realizationNumber: newRlzNumber,
      requestId: reqId,
      requestNumber: reqNumber,
      categoryId: cat?.id,
      categoryCode: cat?.categoryCode,
      categoryName: cat?.name,
      requestTitle: targetTitle,
      title: payload.itemName || targetTitle,
      submitterName: payload.submitterName || 'Eko Prasetyo, ST (Pelaksana)',
      verifierName: 'Siti Rahma, SE (Finance)',
      totalRequested: requestedAmt,
      totalRealizedAmount: actualAmt,
      remainingBalance: remaining,
      status: 'VERIFIED_FINANCE',
      settledAt: new Date().toISOString(),
      notes: 'Faktur: ' + (payload.invoiceNumber || '-') + ' | Vendor: ' + (payload.vendorName || '-'),
      items: [
        {
          itemName: payload.itemName || targetTitle,
          invoiceNumber: payload.invoiceNumber || '-',
          vendorName: payload.vendorName || '-',
          actualTotalPrice: actualAmt,
          invoiceDate: payload.invoiceDate || new Date().toISOString().slice(0, 10)
        }
      ]
    };

    db.realizations.unshift(newRlz);
    db.auditLogs.unshift({
      id: String(Date.now()),
      userName: payload.submitterName || 'Eko Prasetyo, ST',
      action: 'SUBMIT_LPJ',
      entityName: 'REALIZATION',
      ticket: newRlzNumber,
      detail: 'Pencatatan LPJ ' + newRlzNumber + ' (' + cat.name + '): Belanja riil Rp ' + actualAmt.toLocaleString('id-ID') + ' (Kasbon: Rp ' + requestedAmt.toLocaleString('id-ID') + ')',
      timestamp: new Date().toISOString()
    });

    writeDb(db);
    return sendJson(res, 201, { success: true, message: 'LPJ berhasil dicatat.', data: newRlz });
  }

  // POST /api/v1/realizations/:id/settle
  if (method === 'POST' && pathname.startsWith('/api/v1/realizations/') && pathname.endsWith('/settle')) {
    const id = pathname.split('/')[4];
    const db = readDb();
    const rlz = db.realizations.find(r => r.id === id);

    if (!rlz) {
      return sendJson(res, 404, { success: false, message: 'LPJ tidak ditemukan.' });
    }

    rlz.status = 'SETTLED';
    rlz.settledAt = new Date().toISOString();

    // Settle the related request
    const relReq = db.requests.find(r => r.id === rlz.requestId);
    if (relReq) {
      relReq.currentStatus = 'SETTLED';

      // Deduct committed amount and add to realized amount
      const budgetItemId = relReq.items?.[0]?.budgetItemId;
      if (budgetItemId) {
        const bItem = db.budgetItems.find(i => i.id === budgetItemId);
        if (bItem) {
          bItem.committedAmount = Math.max(0, Number(bItem.committedAmount || 0) - Number(relReq.totalAmountRequested));
          bItem.realizedAmount = Number(bItem.realizedAmount || 0) + Number(rlz.totalRealizedAmount);
        }
      }
    }

    db.auditLogs.unshift({
      id: String(Date.now()),
      userName: 'Siti Rahma, SE (Finance)',
      action: 'SETTLE',
      entityName: 'REALIZATION',
      ticket: rlz.realizationNumber,
      detail: `Settlement tuntas. Pagu realisasi diperbarui permanen (+ Rp ${Number(rlz.totalRealizedAmount).toLocaleString('id-ID')})`,
      timestamp: new Date().toISOString()
    });

    writeDb(db);
    return sendJson(res, 200, { success: true, message: 'Settlement LPJ tuntas.', data: rlz });
  }

  // Default 404
  return sendJson(res, 404, { success: false, message: `Endpoint ${method} ${pathname} tidak ditemukan.` });
});

server.listen(PORT, () => {
  console.log('=====================================================================');
  console.log(' 🚀 REALISASI DANA PROJECT TAMBUN - UNIFIED APPLICATION SERVER');
  console.log('=====================================================================');
  console.log(` • Dashboard Antarmuka Web : http://localhost:${PORT}`);
  console.log(` • REST API Endpoint      : http://localhost:${PORT}/api/v1/data`);
  console.log(` • Data Persistence       : ${DB_PATH}`);
  console.log('=====================================================================');
  console.log(' Server berjalan aktif dan siap menerima permintaan pengguna...');
});
