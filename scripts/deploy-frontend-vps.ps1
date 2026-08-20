# Build + sync frontend para VPS (Windows).
# Da raiz do repo:
#   .\scripts\deploy-frontend-vps.ps1 -PasswordOnly -RestartFrontend
#   .\scripts\deploy-frontend-vps.ps1 -PasswordOnly -RestartFrontend -SshPort 65025
param(
    [switch]$PasswordOnly,
    [switch]$RestartFrontend,
    [switch]$SkipInstall,
    [int]$SshPort = 0
)

$ErrorActionPreference = "Stop"
$root = Split-Path $PSScriptRoot -Parent

Write-Host "=== Casa da Paz - Deploy frontend (PC -> VPS) ===" -ForegroundColor Cyan
Write-Host "Repo: $root" -ForegroundColor DarkGray

& (Join-Path $PSScriptRoot "build-frontend-prod.ps1") -SkipInstall:$SkipInstall

$syncArgs = @{
    PasswordOnly = $PasswordOnly
    RestartFrontend = $RestartFrontend
}
if ($SshPort -gt 0) { $syncArgs.SshPort = $SshPort }

& (Join-Path $PSScriptRoot "sync-frontend-vps.ps1") @syncArgs

Write-Host "Deploy frontend concluido." -ForegroundColor Green
