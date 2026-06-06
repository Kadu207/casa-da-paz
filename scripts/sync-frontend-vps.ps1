# Envia frontend/dist para a VPS (build local antes: cd frontend; npm run build)
param(
    [string]$RemoteHost = "",
    [string]$RemotePath = "~/casadapaz/frontend/dist"
)

$ErrorActionPreference = "Stop"
$root = Split-Path $PSScriptRoot -Parent
$localDist = Join-Path $root "frontend\dist"
$localConfig = Join-Path $PSScriptRoot "vps.local.ps1"

if (-not $RemoteHost) {
    if (Test-Path $localConfig) { . $localConfig; $RemoteHost = $script:VpsRemoteHost }
    if (-not $RemoteHost) { $RemoteHost = "gestaoti@128.140.77.31" }
}

if (-not (Test-Path (Join-Path $localDist "index.html"))) {
    throw "frontend\dist\index.html ausente. Rode: cd frontend; npm ci; npm run build"
}

Write-Host "Enviando frontend/dist para ${RemoteHost}" -ForegroundColor Cyan
ssh $RemoteHost "mkdir -p $RemotePath"
scp -r "$localDist\*" "${RemoteHost}:${RemotePath}/"
ssh $RemoteHost "chmod -R a+rX $RemotePath"

Write-Host ""
Write-Host "OK - Na VPS reinicie o frontend:" -ForegroundColor Green
Write-Host ('  ssh ' + $RemoteHost)
Write-Host '  cd ~/casadapaz/infra'
Write-Host '  ./scripts/compose-prod.sh restart frontend'
