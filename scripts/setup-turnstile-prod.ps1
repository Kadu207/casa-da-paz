# Aplica Turnstile na VPS: site key no backend + restart + deploy frontend (PC)
# Uso (da raiz do repo):
#   .\scripts\setup-turnstile-prod.ps1 -SiteKey "0x4AAAA..." -PasswordOnly
param(
  [Parameter(Mandatory = $true)]
  [string]$SiteKey,
  [switch]$PasswordOnly,
  [switch]$SkipFrontend
)

$ErrorActionPreference = "Stop"
$repoRoot = Split-Path $PSScriptRoot -Parent
$remote = "gestaoti@128.140.77.31"
$sshPort = 65022

Write-Host "=== Turnstile prod ===" -ForegroundColor Cyan

$sshExtra = @('-p', "$sshPort")
if ($PasswordOnly) {
  $sshExtra += @('-o', 'PreferredAuthentications=password', '-o', 'PubkeyAuthentication=no', '-o', 'BatchMode=no')
}

$keyLine = "TURNSTILE_SITE_KEY=$SiteKey"
$remoteCmd = @"
cd ~/casadapaz/infra
if grep -q '^TURNSTILE_SITE_KEY=' .env.production 2>/dev/null; then
  sed -i 's|^TURNSTILE_SITE_KEY=.*|$keyLine|' .env.production
else
  echo '$keyLine' >> .env.production
fi
grep TURNSTILE .env.production
cd ~/casadapaz
git pull origin main
cd infra
./scripts/compose-prod.sh up -d --build backend
./scripts/compose-prod.sh restart backend
curl -s http://127.0.0.1:9080/api/public/portal-config
"@

Write-Host "1. VPS: site key + backend rebuild..." -ForegroundColor Yellow
& ssh @sshExtra $remote $remoteCmd

if (-not $SkipFrontend) {
  Write-Host "2. PC: deploy frontend..." -ForegroundColor Yellow
  & (Join-Path $PSScriptRoot "deploy-frontend-vps.ps1") -PasswordOnly:$PasswordOnly -SkipInstall
}

Write-Host ""
Write-Host "OK - Purge Cloudflare cache e teste aba anonima em /public/agendar" -ForegroundColor Green
