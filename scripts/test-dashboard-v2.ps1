# Smoke 017: GET /metricas/resumo com filtro mes/ano
$ErrorActionPreference = "Stop"
$base = if ($env:CASADAPAZ_API) { $env:CASADAPAZ_API.TrimEnd('/') } else { "http://localhost:3000/api" }

Write-Host "1. Login admin..."
$login = Invoke-RestMethod -Uri "$base/auth/login" -Method POST -ContentType "application/json" `
  -Body '{"login":"admin","senha":"admin123"}'
$headers = @{ Authorization = "Bearer $($login.token)" }

$mes = (Get-Date).Month
$ano = (Get-Date).Year

Write-Host "2. Resumo sem periodo..."
$r0 = Invoke-RestMethod -Uri "$base/metricas/resumo" -Headers $headers
if ($null -eq $r0.financeiro) {
  Write-Host "FALHA: resposta sem bloco financeiro." -ForegroundColor Red
  exit 1
}
Write-Host "   periodo=$($r0.periodo) receitas=$($r0.financeiro.receitasConcluidas)"

Write-Host "3. Resumo mes=$mes ano=$ano..."
$r1 = Invoke-RestMethod -Uri "$base/metricas/resumo?mes=$mes&ano=$ano" -Headers $headers
if (-not $r1.periodo -or [int]$r1.periodo.mes -ne $mes -or [int]$r1.periodo.ano -ne $ano) {
  Write-Host "FALHA: periodo incorreto na resposta." -ForegroundColor Red
  exit 1
}
Write-Host "   de=$($r1.periodo.de) ate=$($r1.periodo.ate) presencas=$($r1.operacional.presencasNoMes)"

Write-Host "4. Mes invalido -> 400..."
try {
  Invoke-RestMethod -Uri "$base/metricas/resumo?mes=13&ano=$ano" -Headers $headers
  Write-Host "FALHA: deveria retornar 400." -ForegroundColor Red
  exit 1
} catch {
  if ($_.Exception.Response.StatusCode.value__ -ne 400) { throw }
  Write-Host "   OK: 400"
}

Write-Host ""
Write-Host "OK - Dashboard v2 (017) API validada." -ForegroundColor Green
Write-Host "UI: http://localhost:5173/app/dashboard"
