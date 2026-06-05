# Importa workflows N8N via CLI no container (sem API key)
$ErrorActionPreference = "Stop"
$root = Split-Path $PSScriptRoot -Parent
$workflowsDir = Join-Path $root "infra\n8n\workflows"

if (-not (docker ps -q -f name=casadapaz_n8n)) {
  Write-Host "Container casadapaz_n8n nao esta rodando. Execute .\scripts\start-messaging.ps1"
  exit 1
}

Write-Host "Copiando workflows para o container..."
docker exec casadapaz_n8n rm -rf /tmp/n8n-workflows 2>$null | Out-Null
docker cp "$workflowsDir" casadapaz_n8n:/tmp/n8n-workflows

Write-Host "Importando..."
docker exec casadapaz_n8n n8n import:workflow --separate --input=/tmp/n8n-workflows

Write-Host "Publicando workflows..."
$ids = docker exec casadapaz_n8n n8n list:workflow 2>&1 | ForEach-Object {
  if ($_ -match '^([A-Za-z0-9]+)\|Casa da Paz') { $Matches[1] }
}
foreach ($id in $ids) {
  if ($id) {
    docker exec casadapaz_n8n n8n publish:workflow --id=$id 2>&1 | Out-Null
  }
}
Write-Host "Reiniciando n8n para ativar webhooks..."
docker restart casadapaz_n8n | Out-Null
Start-Sleep -Seconds 8

Write-Host ""
Write-Host "Webhooks ativos:"
Write-Host "  POST http://localhost:5678/webhook/casadapaz-agendamento"
Write-Host "  POST http://localhost:5678/webhook/casadapaz-agendamento-confirmado"
Write-Host "  POST http://localhost:5678/webhook/casadapaz-agendamento-cancelado"
