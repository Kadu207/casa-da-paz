# T10 — Smoke E2E agendamento -> N8N em producao (012)
# cd "C:\Projetos DEV\Casa da Paz"
# $env:CASADAPAZ_API = "https://casadapaz.inovatitech.com.br/api"
# $env:CASADAPAZ_LOGIN = "admin"
# $env:CASADAPAZ_SENHA = "suaSenhaProd"
# .\scripts\test-agendamento-n8n-prod.ps1
$ErrorActionPreference = "Stop"
$repoRoot = Split-Path $PSScriptRoot -Parent
Set-Location $repoRoot

$base = if ($env:CASADAPAZ_API) { $env:CASADAPAZ_API.TrimEnd('/') } else {
  Write-Host "Defina CASADAPAZ_API (ex.: https://casadapaz.inovatitech.com.br/api)" -ForegroundColor Red
  exit 1
}
$loginUser = if ($env:CASADAPAZ_LOGIN) { $env:CASADAPAZ_LOGIN } else { "admin" }
$loginPass = if ($env:CASADAPAZ_SENHA) { $env:CASADAPAZ_SENHA } else { $null }

if (-not $loginPass -or $loginPass.Length -lt 6) {
  Write-Host "Defina CASADAPAZ_SENHA com a senha real de producao (minimo 6 caracteres)." -ForegroundColor Red
  exit 1
}

Write-Host "API: $base"
Write-Host "1. Health..."
$healthUrl = ($base -replace '/api$', '') + '/health'
$health = Invoke-RestMethod -Uri $healthUrl -TimeoutSec 30
Write-Host "   $($health | ConvertTo-Json -Compress)"

Write-Host "2. Login [$loginUser]..."
$loginBody = @{ login = $loginUser; senha = $loginPass } | ConvertTo-Json
try {
  $login = Invoke-RestMethod -Uri "$base/auth/login" -Method POST -ContentType "application/json" -Body $loginBody
} catch {
  Write-Host "FALHA no login - verifique CASADAPAZ_LOGIN e CASADAPAZ_SENHA." -ForegroundColor Red
  throw
}
$headers = @{ Authorization = "Bearer $($login.token)" }

Write-Host "3. Agendamento publico (Turnstile exige token via portal; use pendente se falhar)..."
$tel = "3199{0:D7}" -f (Get-Random -Maximum 9999999)
$agId = $null
try {
  $agBody = @{
    nome = "Smoke T10 $(Get-Date -Format 'yyyyMMdd-HHmm')"
    telefone = $tel
    observacao = "E2E prod T10"
    aceiteLgpd = $true
  } | ConvertTo-Json
  $ag = Invoke-RestMethod -Uri "$base/public/agendamentos" -Method POST -ContentType "application/json" -Body $agBody
  $agId = $ag.id
  Write-Host "   #$agId n8n novo=$($ag.n8n.enviado)"
} catch {
  Write-Host "   Portal bloqueado (Turnstile) - usando PENDENTE existente." -ForegroundColor Yellow
  $pend = Invoke-RestMethod -Uri "$base/agendamentos?status=PENDENTE" -Headers $headers
  if (-not $pend -or @($pend).Count -lt 1) {
    Write-Host "FALHA: crie um agendamento em /public/agendar e rode de novo." -ForegroundColor Red
    throw
  }
  $agId = $pend[0].id
  Write-Host "   Usando pendente #$agId ($($pend[0].nome))"
}

Write-Host "4. Confirmar recepcao..."
$conf = Invoke-RestMethod -Uri "$base/agendamentos/$agId/confirmar" -Method PATCH -Headers $headers `
  -ContentType "application/json" -Body '{"criarPessoa":false}'
Write-Host "   status=$($conf.status) n8n=$($conf.n8n | ConvertTo-Json -Compress)"

if (-not $conf.n8n.enviado) {
  Write-Host "FALHA: N8N nao disparou na confirmacao." -ForegroundColor Red
  exit 1
}

Write-Host ""
Write-Host "OK - T10 parcial: confirmacao + N8N backend." -ForegroundColor Green
