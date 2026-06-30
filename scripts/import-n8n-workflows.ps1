# Importa workflows N8N via CLI no container (sem API key)
$ErrorActionPreference = "Stop"
$root = Split-Path $PSScriptRoot -Parent
$workflowsDir = Join-Path $root "infra\n8n\workflows"
$container = "casadapaz_n8n"

if (-not (docker ps -q -f name=$container)) {
  Write-Host "Container $container nao esta rodando. Execute .\scripts\start-messaging.ps1"
  exit 1
}

$importDir = "/tmp/n8n-workflows-import-$(Get-Date -Format 'yyyyMMddHHmmss')"

Write-Host "Copiando workflows para o container ($importDir)..."
$prevEap = $ErrorActionPreference
$ErrorActionPreference = "Continue"
docker exec -u root $container rm -rf /tmp/n8n-workflows 2>&1 | Out-Null
$ErrorActionPreference = $prevEap

docker cp "$workflowsDir" "${container}:${importDir}"

Write-Host "Importando..."
docker exec $container n8n import:workflow --separate --input=$importDir

Write-Host "Publicando workflows..."
$ids = docker exec $container n8n list:workflow 2>&1 | ForEach-Object {
  if ($_ -match '^([A-Za-z0-9]+)\|Casa da Paz') { $Matches[1] }
}
foreach ($id in $ids) {
  if ($id) {
    docker exec $container n8n publish:workflow --id=$id 2>&1 | Out-Null
  }
}

Write-Host "Limpando pasta temporaria..."
$ErrorActionPreference = "Continue"
docker exec -u root $container rm -rf $importDir 2>&1 | Out-Null
$ErrorActionPreference = "Stop"

Write-Host "Reiniciando n8n para ativar webhooks..."
docker restart $container | Out-Null
Start-Sleep -Seconds 8

Write-Host ""
Write-Host "Webhooks ativos:"
Write-Host "  POST http://localhost:5678/webhook/casadapaz-agendamento"
Write-Host "  POST http://localhost:5678/webhook/casadapaz-agendamento-confirmado"
Write-Host "  POST http://localhost:5678/webhook/casadapaz-agendamento-cancelado"
Write-Host "  POST http://localhost:5678/webhook/casadapaz-lembrete-atraso"
Write-Host "  POST http://localhost:5678/webhook/casadapaz-recibo-pago"
Write-Host "  POST http://localhost:5678/webhook/casadapaz-ingresso-oficina"
