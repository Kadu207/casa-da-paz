# Envia infra/.env.production local para a VPS (não vai para o Git)
param(
    [string]$RemoteHost = "",
    [string]$RemotePath = "~/casadapaz/infra/.env.production"
)

$ErrorActionPreference = "Stop"
$root = Split-Path $PSScriptRoot -Parent
$localFile = Join-Path $root "infra\.env.production"
$localConfig = Join-Path $PSScriptRoot "vps.local.ps1"

if (-not $RemoteHost) {
    if (Test-Path $localConfig) {
        . $localConfig
        $RemoteHost = $script:VpsRemoteHost
    }
    if (-not $RemoteHost) {
        # IP Hetzner inovati-server — override: .\scripts\sync-env-vps.ps1 -RemoteHost gestaoti@SEU_IP
        $RemoteHost = "gestaoti@128.140.77.31"
    }
}

if (-not (Test-Path $localFile)) {
    throw "Arquivo não encontrado: $localFile`nCopie infra\.env.production.example e preencha os valores."
}

Write-Host "Enviando .env.production para ${RemoteHost}:${RemotePath}" -ForegroundColor Cyan
scp $localFile "${RemoteHost}:${RemotePath}"

Write-Host ""
Write-Host "OK — Na VPS, confira e redeploy:" -ForegroundColor Green
Write-Host ('  ssh ' + $RemoteHost)
Write-Host '  cd ~/casadapaz/infra'
Write-Host '  grep NGINX_CONF .env.production && grep HOST_HTTP_PORT .env.production'
Write-Host '  CASADAPAZ_DEPLOY_CONFIRMED=yes ./scripts/deploy.sh'
