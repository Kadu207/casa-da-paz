# Build do frontend com variaveis VITE_* de producao.
# Rode da raiz do repo: .\scripts\build-frontend-prod.ps1
# NAO use "..." no caminho - o script resolve a raiz automaticamente.
param(
    [switch]$SkipInstall
)

$ErrorActionPreference = "Stop"
$root = Split-Path $PSScriptRoot -Parent
$frontend = Join-Path $root "frontend"

if (-not (Test-Path (Join-Path $frontend "package.json"))) {
    throw "package.json nao encontrado em: $frontend"
}

Set-Location $frontend

# Limpar dist evita EPERM no sw.js (PWA) quando arquivos ficam bloqueados no Windows
$distDir = Join-Path $frontend "dist"
if (Test-Path $distDir) {
    Write-Host "Limpando $distDir" -ForegroundColor DarkGray
    Remove-Item -Recurse -Force $distDir
}

if (-not $SkipInstall) {
    Write-Host "npm ci em $frontend" -ForegroundColor Cyan
    npm.cmd ci
}

if (-not (Test-Path ".env.production")) {
    Write-Host "Aviso: frontend\.env.production ausente - copie de .env.production.example" -ForegroundColor Yellow
}

Write-Host "npm run build" -ForegroundColor Cyan
npm.cmd run build

if (-not (Test-Path "dist\index.html")) {
    throw "Build falhou: dist\index.html nao gerado"
}

Write-Host "OK - dist pronto em $frontend\dist" -ForegroundColor Green
