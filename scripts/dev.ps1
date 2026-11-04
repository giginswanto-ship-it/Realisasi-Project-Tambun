# PowerShell Quick Start Script
Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host " SISTEM MONITORING PEMBELANJAAN & REALISASI DANA PROYEK TAMBUN" -ForegroundColor Cyan
Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host ""

$dockerInstalled = Get-Command docker -ErrorAction SilentlyContinue

if ($dockerInstalled) {
    Write-Host "[1/2] Menjalankan Docker Compose..." -ForegroundColor Green
    docker compose up -d
    Write-Host ""
    Write-Host "[2/2] Layanan Siap:" -ForegroundColor Green
    Write-Host " - Frontend Dashboard : http://localhost:3000" -ForegroundColor Yellow
    Write-Host " - Backend API Core   : http://localhost:4000/api/v1" -ForegroundColor Yellow
    Write-Host " - Swagger API Docs   : http://localhost:4000/api/docs" -ForegroundColor Yellow
    Write-Host " - MinIO S3 Storage   : http://localhost:9001" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Menampilkan logs (Ctrl+C untuk selesai)..." -ForegroundColor Gray
    docker compose logs -f
} else {
    Write-Host "[INFO] Menjalankan via Local PNPM Workspace..." -ForegroundColor Yellow
    pnpm install
    pnpm --filter @tambun/database prisma:generate
    pnpm dev
}
