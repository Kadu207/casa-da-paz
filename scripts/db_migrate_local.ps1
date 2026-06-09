# Migração Prisma local (contorna bloqueio de npm.ps1 no PowerShell)
Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$root = Split-Path $PSScriptRoot -Parent
. "$PSScriptRoot\setup-path.ps1"

Set-Location "$root\backend"

Write-Host "Aplicando migracoes..." -ForegroundColor Cyan
npm run db:migrate
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "Gerando Prisma Client..." -ForegroundColor Cyan
npm run db:generate
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "Migracao local concluida." -ForegroundColor Green
