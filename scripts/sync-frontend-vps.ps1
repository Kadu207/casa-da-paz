# Envia frontend/dist para a VPS — rode NO SEU PC (Windows PowerShell), nao na VPS.
# Build antes: Set-Location frontend; npm run build
# Linux/Debian: use scripts/sync-frontend-vps.sh (chave SSH em ~/.ssh).
#
# Windows sem chave: .\scripts\sync-frontend-vps.ps1 -PasswordOnly -RestartFrontend
# Com chave local:   .\scripts\sync-frontend-vps.ps1 -RestartFrontend
param(
    [string]$RemoteHost = "",
    [string]$RemotePath = "~/casadapaz/frontend/dist",
    [switch]$RestartFrontend,
    [switch]$PasswordOnly
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

$sshExtra = @()
if ($PasswordOnly) {
    $sshExtra = @(
        '-o', 'PreferredAuthentications=password',
        '-o', 'PubkeyAuthentication=no',
        '-o', 'BatchMode=no'
    )
    Write-Host "Auth: senha SSH (PasswordOnly)" -ForegroundColor DarkGray
} else {
    Write-Host "Auth: padrao OpenSSH (chave se existir em ~/.ssh)" -ForegroundColor DarkGray
}

function Invoke-Ssh {
    param([string]$Target, [string]$Command)
    & ssh @sshExtra $Target $Command
}

function Invoke-Scp {
    param([string[]]$ScpArgs)
    & scp @sshExtra @ScpArgs
}

function Invoke-RemotePermissions {
    param([string]$SshTarget, [string]$Path)
    $cmd = "find $Path -type d -exec chmod 755 {} \; && find $Path -type f -exec chmod 644 {} \; && test -r ${Path}/index.html && echo PERMS_OK || echo PERMS_FAIL"
    for ($i = 1; $i -le 3; $i++) {
        $result = Invoke-Ssh -Target $SshTarget -Command $cmd 2>&1 | Out-String
        if ($result -match "PERMS_OK") {
            Write-Host "Permissoes OK em ${Path}" -ForegroundColor Green
            return
        }
        Write-Host "Permissoes tentativa $i falhou - retry..." -ForegroundColor Yellow
        Start-Sleep -Seconds 2
    }
    throw "Permissoes nao aplicadas em ${Path}. Na VPS: cd ~/casadapaz/infra && ./scripts/fix-frontend-permissions.sh"
}

Write-Host "Enviando frontend/dist para ${RemoteHost}" -ForegroundColor Cyan

Invoke-Ssh -Target $RemoteHost -Command "mkdir -p $RemotePath && rm -rf ${RemotePath}/*"
Invoke-Scp -ScpArgs @('-r', "$localDist/.", "${RemoteHost}:${RemotePath}/")
Invoke-RemotePermissions -SshTarget $RemoteHost -Path $RemotePath

$assetMatch = Select-String -Path (Join-Path $localDist "index.html") -Pattern '/assets/(index-[^"]+\.js)' -AllMatches
if ($assetMatch) {
    $jsBundle = $assetMatch.Matches[0].Groups[1].Value
    $exists = Invoke-Ssh -Target $RemoteHost -Command "test -f ${RemotePath}/assets/${jsBundle} && echo OK || echo MISSING"
    if ($exists -notmatch "OK") {
        throw "Bundle ${jsBundle} ausente em ${RemotePath}/assets/ apos sync."
    }
    Write-Host "Arquivo: assets/${jsBundle}" -ForegroundColor Green

    $originCode = Invoke-Ssh -Target $RemoteHost -Command "curl -sf -o /dev/null -w '%{http_code}' http://127.0.0.1:9080/assets/${jsBundle} 2>/dev/null || echo 000"
    $originCode = ($originCode -replace '\s', '').Trim()
    if ($originCode -ne "200") {
        throw "Origin :9080 retornou HTTP ${originCode} para /assets/${jsBundle}. Rode: cd ~/casadapaz/infra && ./scripts/fix-frontend-permissions.sh && ./scripts/compose-prod.sh restart frontend"
    }
    Write-Host "Origin :9080 serve assets/${jsBundle} (HTTP 200)" -ForegroundColor Green
}

if ($RestartFrontend) {
    Invoke-Ssh -Target $RemoteHost -Command "cd ~/casadapaz/infra && ./scripts/compose-prod.sh restart frontend"
    Write-Host "Frontend reiniciado." -ForegroundColor Green
}

Write-Host ""
Write-Host "OK - Proximos passos:" -ForegroundColor Green
Write-Host ('  ssh ' + $RemoteHost)
Write-Host '  cd ~/casadapaz/infra'
Write-Host '  ./scripts/compose-prod.sh restart frontend'
Write-Host ""
Write-Host "Cloudflare: Caching > Purge Cache > Purge Everything (ou URL /assets/*)" -ForegroundColor Yellow
Write-Host "  Resposta HTML em cache pode persistir ate 4h sem purge." -ForegroundColor Yellow
