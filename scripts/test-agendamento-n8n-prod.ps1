# T10 — Smoke E2E agendamento -> N8N em producao (012)
# Uso: $env:CASADAPAZ_API = "https://casadapaz.inovatitech.com.br/api"
#      $env:CASADAPAZ_LOGIN / $env:CASADAPAZ_SENHA (DIRETORIA ou RECEPCAO)
$ErrorActionPreference = "Stop"
$base = if ($env:CASADAPAZ_API) { $env:CASADAPAZ_API.TrimEnd('/') } else {
  Write-Host "Defina CASADAPAZ_API (ex.: https://casadapaz.inovatitech.com.br/api)" -ForegroundColor Red
  exit 1
}
$loginUser = if ($env:CASADAPAZ_LOGIN) { $env:CASADAPAZ_LOGIN } else { "admin" }
$loginPass = if ($env:CASADAPAZ_SENHA) { $env:CASADAPAZ_SENHA } else { "admin123" }

Write-Host "API: $base"
Write-Host "1. Health..."
$health = Invoke-RestMethod -Uri ($base -replace '/api$', '/health') -TimeoutSec 30
Write-Host "   $($health | ConvertTo-Json -Compress)"

Write-Host "2. Login [$loginUser]..."
$login = Invoke-RestMethod -Uri "$base/auth/login" -Method POST -ContentType "application/json" `
  -Body (@{ login = $loginUser; senha = $loginPass } | ConvertTo-Json)
$headers = @{ Authorization = "Bearer $($login.token)" }

Write-Host "3. Agendamento publico..."
$tel = "3199{0:D7}" -f (Get-Random -Maximum 9999999)
$ag = Invoke-RestMethod -Uri "$base/public/agendamentos" -Method POST -ContentType "application/json" `
  -Body (@{
    nome = "Smoke T10 $(Get-Date -Format 'yyyyMMdd-HHmm')"
    telefone = $tel
    observacao = "E2E prod T10"
  } | ConvertTo-Json)
Write-Host "   #$($ag.id) n8n novo=$($ag.n8n.enviado)"

Write-Host "4. Confirmar recepcao..."
$conf = Invoke-RestMethod -Uri "$base/agendamentos/$($ag.id)/confirmar" -Method PATCH -Headers $headers `
  -ContentType "application/json" -Body '{"criarPessoa":false}'
Write-Host "   status=$($conf.status) n8n=$($conf.n8n | ConvertTo-Json -Compress)"

if (-not $conf.n8n.enviado) {
  Write-Host "FALHA: N8N nao disparou na confirmacao (ver N8N Executions na VPS)." -ForegroundColor Red
  exit 1
}

Write-Host ""
Write-Host "OK - T10 parcial: portal + confirmacao + N8N backend." -ForegroundColor Green
Write-Host "Manual: widget /public/contato + WhatsApp apos 012-T8."
