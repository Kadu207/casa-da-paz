# Smoke 018: GET /metricas/meu-painel (MEDIUM only)
$ErrorActionPreference = "Stop"
$base = if ($env:CASADAPAZ_API) { $env:CASADAPAZ_API.TrimEnd('/') } else { "http://localhost:3000/api" }

Write-Host "1. Login medium..."
$login = Invoke-RestMethod -Uri "$base/auth/login" -Method POST -ContentType "application/json" `
  -Body '{"login":"medium","senha":"medium123"}'
$headers = @{ Authorization = "Bearer $($login.token)" }

Write-Host "2. GET /metricas/meu-painel..."
$painel = Invoke-RestMethod -Uri "$base/metricas/meu-painel" -Headers $headers
if (-not $painel.pessoa -or -not $painel.financeiro) {
  Write-Host "FALHA: shape incompleto." -ForegroundColor Red
  exit 1
}
Write-Host "   $($painel.pessoa.nomeCompleto) | saldo=$($painel.financeiro.saldo) presencas=$($painel.presencas.Count)"

Write-Host "3. Admin nao acessa meu-painel -> 403..."
$admin = Invoke-RestMethod -Uri "$base/auth/login" -Method POST -ContentType "application/json" `
  -Body '{"login":"admin","senha":"admin123"}'
$adminHeaders = @{ Authorization = "Bearer $($admin.token)" }
try {
  Invoke-RestMethod -Uri "$base/metricas/meu-painel" -Headers $adminHeaders
  Write-Host "FALHA: admin deveria receber 403." -ForegroundColor Red
  exit 1
} catch {
  if ($_.Exception.Response.StatusCode.value__ -ne 403) { throw }
  Write-Host "   OK: 403"
}

Write-Host ""
Write-Host "OK - Painel Medium (018) API validada." -ForegroundColor Green
Write-Host "UI: http://localhost:5173/app/dashboard (login medium/medium123)"
