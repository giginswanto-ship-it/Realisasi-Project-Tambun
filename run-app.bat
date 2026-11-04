@echo off
TITLE Realisasi Dana Project Tambun - One Click Launcher
echo =====================================================================
echo  SISTEM MONITORING PEMBELANJAAN & REALISASI DANA PROYEK TAMBUN
echo =====================================================================
echo.
echo [1/3] Memeriksa instalasi Docker...
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [PERINGATAN] Docker tidak terdeteksi di sistem PATH!
    echo Menjalankan mode Node/Pnpm lokal...
    call pnpm install
    call pnpm --filter @tambun/database prisma:generate
    echo Memulai Server API dan Frontend Web...
    start cmd /k "cd apps\api && pnpm start:dev"
    start cmd /k "cd apps\web && pnpm dev"
    echo Aplikasi berjalan:
    echo - Frontend Web : http://localhost:3000
    echo - Backend API  : http://localhost:4000/api/v1
    echo - Swagger Docs : http://localhost:4000/api/docs
    goto end
)

echo [2/3] Memulai Docker Compose (PostgreSQL, MinIO, NestJS API, Next.js Web)...
docker compose up -d

echo.
echo [3/3] Berhasil dijalankan!
echo =====================================================================
echo  LAYANAN SIAP DIGUNAKAN:
echo  - Frontend Dashboard : http://localhost:3000
echo  - Backend API Core   : http://localhost:4000/api/v1
echo  - Swagger OpenAPI    : http://localhost:4000/api/docs
echo  - MinIO Storage UI   : http://localhost:9001 (minioadmin / minioadmin)
echo  - PostgreSQL Port    : localhost:5432 (postgres / postgres)
echo =====================================================================
echo.
echo Tekan sembarang tombol untuk melihat log kontainer secara live...
pause >nul
docker compose logs -f

:end
