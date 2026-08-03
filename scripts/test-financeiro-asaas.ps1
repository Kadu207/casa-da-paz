# Smoke 021 — Financeiro Asaas + Marketing (API local)
# Uso: .\scripts\test-financeiro-asaas.ps1
# Requer backend em http://localhost:3000 e seed com admin/admin123

$ErrorActionPreference = 'Stop'
$base = $env:CASADAPAZ_API_URL
if (-not $base) { $base = 'http://localhost:3000/api' }

function Login($login, $senha) {
  $body = @{ login = $login; senha = $senha } | ConvertTo-Json
  $res = Invoke-RestMethod -Uri "$base/auth/login" -Method POST -Body $body -ContentType 'application/json'
  return $res.token
}

Write-Host "== Login DIRETORIA =="
$token = Login 'admin' 'admin123'
$h = @{ Authorization = "Bearer $token" }

Write-Host "== Contas =="
$contas = Invoke-RestMethod -Uri "$base/financeiro/contas" -Headers $h
Write-Host ("Contas: {0}" -f $contas.Count)

Write-Host "== Transparencia =="
$mes = (Get-Date).Month
$ano = (Get-Date).Year
$tr = Invoke-RestMethod -Uri "$base/financeiro/transparencia?mes=$mes&ano=$ano" -Headers $h
Write-Host ("Saldo periodo: {0}" -f $tr.totais.saldo)

Write-Host "== Cobrancas config =="
$cfg = Invoke-RestMethod -Uri "$base/cobrancas/config" -Headers $h
Write-Host ("Asaas env={0} configured={1}" -f $cfg.env, $cfg.configured)

Write-Host "== Marketing resumo =="
# DIRETORIA tem marketing write
$mk = Invoke-RestMethod -Uri "$base/marketing/resumo" -Headers $h
Write-Host ("Eventos abertos: {0}" -f $mk.eventosAbertos)

Write-Host "== Webhook Asaas (token) =="
try {
  Invoke-RestMethod -Uri "$base/webhooks/asaas" -Method POST -Headers @{ 'asaas-access-token' = 'wrong' } -Body '{"event":"PAYMENT_RECEIVED"}' -ContentType 'application/json'
  Write-Host "ERRO: deveria rejeitar token"
  exit 1
} catch {
  Write-Host "Token invalido rejeitado OK"
}

Write-Host "SMOKE 021 OK"
