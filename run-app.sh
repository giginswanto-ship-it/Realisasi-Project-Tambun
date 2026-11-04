#!/bin/bash
set -e

echo "====================================================================="
echo " SISTEM MONITORING PEMBELANJAAN & REALISASI DANA PROYEK TAMBUN"
echo "====================================================================="
echo ""

if ! command -v docker &> /dev/null; then
    echo "[PERINGATAN] Docker tidak ditemukan. Menjalankan mode PNPM lokal..."
    pnpm install
    pnpm --filter @tambun/database prisma:generate
    pnpm dev
    exit 0
fi

echo "[1/2] Membangun dan menjalankan kontainer Docker..."
docker compose up -d

echo ""
echo "[2/2] Ekosistem Berhasil Berjalan!"
echo "====================================================================="
echo " LAYANAN AKTIF:"
echo " - Frontend Dashboard : http://localhost:3000"
echo " - Backend API Core   : http://localhost:4000/api/v1"
echo " - Swagger OpenAPI    : http://localhost:4000/api/docs"
echo " - MinIO S3 Console   : http://localhost:9001"
echo "====================================================================="
echo ""
echo "Menampilkan logs (Ctrl+C untuk keluar):"
docker compose logs -f
