# Smoke 031 Estoque - rode no PC (PowerShell) com senha real
# Uso:
#   $env:CASADAPAZ_LOGIN = "supervisor"
#   $env:CASADAPAZ_SENHA = "SENHA_REAL_AQUI"
#   .\scripts\smoke-estoque-casa-prod.ps1

param(
  [string]$Base = "https://casadapaz.inovatitech.com.br/api",
  [string]$Login = $env:CASADAPAZ_LOGIN,
  [string]$Senha = $env:CASADAPAZ_SENHA
)

$ErrorActionPreference = "Stop"
if (-not $Login -or -not $Senha) {
  throw "Defina CASADAPAZ_LOGIN e CASADAPAZ_SENHA (ou -Login/-Senha)."
}
if ($Senha -eq "sua-senha") {
  throw "Troque 'sua-senha' pela senha real do usuario."
}

Write-Host "=== Smoke Estoque Casa (prod) ===" -ForegroundColor Cyan

$loginRes = Invoke-RestMethod -Uri "$Base/auth/login" -Method POST -ContentType "application/json" -Body (@{
  login = $Login
  senha = $Senha
} | ConvertTo-Json)
$token = $loginRes.token
$headers = @{ Authorization = "Bearer $token" }
Write-Host "Login OK: $($loginRes.user.login) / $($loginRes.user.setorAcesso)" -ForegroundColor Green

$itens = Invoke-RestMethod -Uri "$Base/estoque-casa/itens" -Headers $headers
Write-Host "Itens: $($itens.Count)" -ForegroundColor Green
$criticos = @($itens | Where-Object { $_.abaixoDoMinimo -eq $true })
Write-Host "Abaixo do minimo: $($criticos.Count)" -ForegroundColor $(if ($criticos.Count -gt 0) { "Yellow" } else { "Green" })

$item = $itens | Select-Object -First 1
if (-not $item) {
  throw "Catalogo vazio - rode na VPS: npx tsx prisma/seed.ts --estoque-casa-only"
}

$mov = Invoke-RestMethod -Uri "$Base/estoque-casa/movimentacoes" -Method POST -Headers $headers -ContentType "application/json" -Body (@{
  itemId = $item.id
  tipo = "ENTRADA"
  quantidade = 1
  motivo = "smoke-031"
} | ConvertTo-Json)
Write-Host "Entrada +1 OK: $($item.nome) saldo=$($mov.item.estoqueAtual)" -ForegroundColor Green

$saida = Invoke-RestMethod -Uri "$Base/estoque-casa/movimentacoes" -Method POST -Headers $headers -ContentType "application/json" -Body (@{
  itemId = $item.id
  tipo = "SAIDA"
  quantidade = 1
  motivo = "smoke-031-revert"
} | ConvertTo-Json)
Write-Host "Saida -1 OK: saldo=$($saida.item.estoqueAtual)" -ForegroundColor Green

$rel = Invoke-RestMethod -Uri "$Base/estoque-casa/relatorio" -Headers $headers
Write-Host "Relatorio OK: criticos=$($rel.criticos.Count) saidasPeriodo=$($rel.totalSaidas)" -ForegroundColor Green

Write-Host ""
Write-Host "SMOKE API OK - valide UI: /app/estoque" -ForegroundColor Green
