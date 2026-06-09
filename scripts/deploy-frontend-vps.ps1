# Build + sync frontend para VPS (Windows).
# Da raiz do repo:
#   .\scripts\deploy-frontend-vps.ps1 -PasswordOnly -RestartFrontend
param(
    [switch]$PasswordOnly,
    [switch]$RestartFrontend,
    [switch]$SkipInstall
)

$ErrorActionPreference = "Stop"
$root = Split-Path $PSScriptRoot -Parent

Write-Host "=== Casa da Paz - Deploy frontend (PC -> VPS) ===" -ForegroundColor Cyan
Write-Host "Repo: $root" -ForegroundColor DarkGray

& (Join-Path $PSScriptRoot "build-frontend-prod.ps1") -SkipInstall:$SkipInstall

& (Join-Path $PSScriptRoot "sync-frontend-vps.ps1") -PasswordOnly:$PasswordOnly -RestartFrontend:$RestartFrontend

Write-Host "Deploy frontend concluido." -ForegroundColor Green
