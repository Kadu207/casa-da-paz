# Envia infra/.env.production local para a VPS (não vai para o Git)
param(
    [string]$RemoteHost = "",
    [int]$SshPort = 0,
    [string]$RemotePath = "~/casadapaz/infra/.env.production"
)

$ErrorActionPreference = "Stop"
$root = Split-Path $PSScriptRoot -Parent
$localFile = Join-Path $root "infra\.env.production"
$localConfig = Join-Path $PSScriptRoot "vps.local.ps1"

if (Test-Path $localConfig) {
    . $localConfig
}
if (-not $RemoteHost) {
    if ($script:VpsRemoteHost) { $RemoteHost = $script:VpsRemoteHost }
    if (-not $RemoteHost) { $RemoteHost = "gestaoti@128.140.77.31" }
}
if ($SshPort -le 0) {
    if ($script:VpsSshPort) { $SshPort = [int]$script:VpsSshPort }
    else { $SshPort = 65022 }
}

if (-not (Test-Path $localFile)) {
    throw "Arquivo não encontrado: $localFile`nCopie infra\.env.production.example e preencha os valores."
}

Write-Host "Enviando .env.production para ${RemoteHost}:${RemotePath} (scp -P $SshPort)" -ForegroundColor Cyan
scp -P $SshPort $localFile "${RemoteHost}:${RemotePath}"

Write-Host ""
Write-Host "OK — Na VPS, confira e redeploy:" -ForegroundColor Green
Write-Host ('  ssh -p ' + $SshPort + ' ' + $RemoteHost)
Write-Host '  cd ~/casadapaz/infra'
Write-Host '  grep NGINX_CONF .env.production && grep HOST_HTTP_PORT .env.production'
Write-Host '  CASADAPAZ_DEPLOY_CONFIRMED=yes ./scripts/deploy.sh'
