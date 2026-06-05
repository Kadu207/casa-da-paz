# E2E: portal -> recepcao confirmar -> webhook N8N confirmado
$ErrorActionPreference = "Stop"
$base = "http://localhost:3000/api"

Write-Host '1. Login recepcao [admin]...'
$login = Invoke-RestMethod -Uri "$base/auth/login" -Method POST -ContentType "application/json" `
  -Body '{"login":"admin","senha":"admin123"}'
$token = $login.token
$headers = @{ Authorization = "Bearer $token" }

Write-Host '2. Criar agendamento via portal...'
$ag = Invoke-RestMethod -Uri "$base/public/agendamentos" -Method POST -ContentType "application/json" `
  -Body '{"nome":"Teste Confirmacao N8N","telefone":"31970001122","observacao":"E2E recepcao"}'
Write-Host "   Agendamento #$($ag.id) - n8n novo: $($ag.n8n.enviado)"

Write-Host "3. Confirmar na recepcao - agendamentos/$($ag.id)/confirmar..."
$conf = Invoke-RestMethod -Uri "$base/agendamentos/$($ag.id)/confirmar" -Method PATCH -Headers $headers `
  -ContentType "application/json" -Body '{"criarPessoa":true}'
Write-Host "   Status: $($conf.status) | Pessoa: $($conf.pessoa.nomeCompleto) | n8n: $($conf.n8n | ConvertTo-Json -Compress)"

Write-Host '4. Webhook N8N confirmado - smoke test...'
$n8n = Invoke-RestMethod -Uri "http://localhost:5678/webhook/casadapaz-agendamento-confirmado" -Method POST `
  -ContentType "application/json" -Body (@{
    workflow = "agendamento_confirmado"
    agendamentoId = $conf.id
    nome = $conf.nome
    telefone = $conf.telefone
  } | ConvertTo-Json)
Write-Host "   N8N respondeu: $($n8n | ConvertTo-Json -Compress)"

if (-not $conf.n8n.enviado) {
  Write-Host 'FALHA: backend nao disparou N8N na confirmacao.' -ForegroundColor Red
  exit 1
}
Write-Host ''
Write-Host 'OK - Veja execucoes em http://localhost:5678 -> Executions' -ForegroundColor Green
