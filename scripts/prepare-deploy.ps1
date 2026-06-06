# Prepara artefatos locais antes do deploy na VPS Hetzner
$ErrorActionPreference = "Stop"
$root = Split-Path $PSScriptRoot -Parent

Write-Host "=== Casa da Paz — Prepare Deploy ===" -ForegroundColor Cyan

Set-Location "$root\frontend"
Write-Host "Build frontend..."
npm ci
npm run build
if (-not (Test-Path "dist\index.html")) {
  throw "frontend/dist não gerado"
}

Set-Location "$root\backend"
Write-Host "Testes backend..."
npm test

Set-Location $root
Write-Host ""
Write-Host "OK — Pronto para deploy na VPS:" -ForegroundColor Green
Write-Host "  1. git push origin main && git push gitlab main"
Write-Host "  2. Na VPS: git pull && cd frontend && npm ci && npm run build"
Write-Host "  3. .\scripts\sync-env-vps.ps1   # envia .env.production para a VPS"
Write-Host "  4. cd infra && CASADAPAZ_DEPLOY_CONFIRMED=yes ./scripts/deploy.sh"
Write-Host ""
Write-Host "Guia completo: docs/memory/runbooks/deploy-vps-passo-a-passo.md"
