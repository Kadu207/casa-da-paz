# E2E local: sync-alertas -> listar -> reenviar -> N8N lembrete_atraso
$ErrorActionPreference = "Stop"
$base = if ($env:CASADAPAZ_API) { $env:CASADAPAZ_API.TrimEnd('/') } else { "http://localhost:3000/api" }
$n8nBase = if ($env:N8N_URL) { $env:N8N_URL.TrimEnd('/') } else { "http://localhost:5678" }

Write-Host "1. Login admin..."
$login = Invoke-RestMethod -Uri "$base/auth/login" -Method POST -ContentType "application/json" `
  -Body '{"login":"admin","senha":"admin123"}'
$headers = @{ Authorization = "Bearer $($login.token)" }

Write-Host "2. Sync alertas (financeiro)..."
Invoke-RestMethod -Uri "$base/financeiro/sync-alertas" -Method POST -Headers $headers | Out-Null

Write-Host "3. Listar alertas pendentes..."
$lista = Invoke-RestMethod -Uri "$base/alertas?disparado=false&limit=5" -Headers $headers
if ($lista.total -lt 1) {
  Write-Host "AVISO: nenhum alerta pendente - seed pode nao ter mensalidades atrasadas." -ForegroundColor Yellow
  exit 0
}
$id = $lista.items[0].id
Write-Host "   Alerta #$id - $($lista.items[0].tipo)"

Write-Host "4. Reenviar via API (dispara N8N)..."
$reenvio = Invoke-RestMethod -Uri "$base/alertas/$id/reenviar" -Method POST -Headers $headers
Write-Host "   enviado=$($reenvio.enviado) motivo=$($reenvio.motivo)"

if (-not $reenvio.enviado) {
  Write-Host "FALHA: reenvio nao chegou ao N8N (verifique N8N_URL no backend/.env)." -ForegroundColor Red
  exit 1
}

Write-Host "5. Smoke direto no webhook N8N..."
$n8n = Invoke-RestMethod -Uri "$n8nBase/webhook/casadapaz-lembrete-atraso" -Method POST `
  -ContentType "application/json" `
  -Headers @{ "X-Webhook-Secret" = $(if ($env:N8N_WEBHOOK_SECRET) { $env:N8N_WEBHOOK_SECRET } else { "n8n-dev-secret" }) } `
  -Body (@{
    workflow = "lembrete_atraso"
    alertaId = $id
    pessoaId = $lista.items[0].pessoaId
    telefone = $lista.items[0].pessoa.telefone
    mensagem = $lista.items[0].mensagem
    tipo = $lista.items[0].tipo
  } | ConvertTo-Json)
Write-Host "   N8N: $($n8n | ConvertTo-Json -Compress)"

Write-Host ""
Write-Host "OK - Alertas reenvio + N8N lembrete_atraso validados." -ForegroundColor Green
Write-Host "UI: http://localhost:5173/app/financeiro/alertas"
Write-Host "N8N: $n8nBase -> Executions"
