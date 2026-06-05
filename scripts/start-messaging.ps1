# N8N + Chatwoot — Casa da Paz (dev local)
$ErrorActionPreference = "Stop"
$root = Split-Path $PSScriptRoot -Parent

Set-Location "$root\infra"

$composeFiles = @("-f", "docker-compose.yml", "-f", "docker-compose.messaging.yml")
if (Test-Path "$root\infra\docker-compose.override.yml") {
  $composeFiles += @("-f", "docker-compose.override.yml")
}
if (Test-Path "$root\infra\docker-compose.messaging.override.yml") {
  $composeFiles += @("-f", "docker-compose.messaging.override.yml")
}

function Invoke-Compose {
  param([string[]]$ComposeArgs)
  & docker compose @composeFiles @ComposeArgs
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}

# Garante Postgres do projeto
Invoke-Compose @("up", "-d", "db")

Start-Sleep -Seconds 3

# Cria banco chatwoot_db se não existir
$dbPort = "5433"
$override = "$root\infra\docker-compose.override.yml"
if (Test-Path $override) {
  if ((Get-Content $override -Raw) -match '"(\d+):5432"') { $dbPort = $Matches[1] }
}

Write-Host "Criando chatwoot_db se necessário (porta $dbPort)..."
docker exec casadapaz_db psql -U admin_casadapaz -d casadapaz_db -tc "SELECT 1 FROM pg_database WHERE datname = 'chatwoot_db'" | Out-Null
$exists = docker exec casadapaz_db psql -U admin_casadapaz -d casadapaz_db -tAc "SELECT 1 FROM pg_database WHERE datname = 'chatwoot_db'"
if ($exists -ne "1") {
  docker exec casadapaz_db psql -U admin_casadapaz -d casadapaz_db -c "CREATE DATABASE chatwoot_db;" 2>&1 | Out-Null
  Write-Host "chatwoot_db criado."
}
# NOTICE do psql vai para stderr — não abortar o script
$prevEap = $ErrorActionPreference
$ErrorActionPreference = 'Continue'
docker exec casadapaz_db psql -U admin_casadapaz -d chatwoot_db -c "CREATE EXTENSION IF NOT EXISTS vector;" 2>&1 | Out-Null
$ErrorActionPreference = $prevEap

# Sobe redis, n8n, chatwoot
Invoke-Compose @("up", "-d", "redis", "n8n", "chatwoot", "chatwoot-sidekiq")

Write-Host ""
Write-Host "Aguardando containers (30s)..."
Start-Sleep -Seconds 30

# Prepara schema Chatwoot (primeira vez)
Write-Host "Preparando banco Chatwoot (db:chatwoot_prepare)..."
$prevEap = $ErrorActionPreference
$ErrorActionPreference = 'Continue'
docker compose @composeFiles run --rm chatwoot bundle exec rails db:chatwoot_prepare 2>&1 | Out-Null
$ErrorActionPreference = $prevEap

Write-Host ""
Write-Host "=== Mensageria Casa da Paz ==="
Write-Host "N8N:      http://localhost:5678  (admin / changeme)"
$chatPort = "3001"
if (Test-Path $override) {
  if ((Get-Content $override -Raw) -match '"(\d+):3000"') { $chatPort = $Matches[1] }
}
Write-Host "Chatwoot: http://localhost:$chatPort"
Write-Host ""
Write-Host "Webhooks N8N (importar workflows de infra/n8n/):"
Write-Host "  POST http://localhost:5678/webhook/casadapaz-agendamento"
Write-Host ""
Write-Host "Scripts (raiz ou infra/):"
Write-Host "  .\scripts\import-n8n-workflows.ps1"
Write-Host "  .\scripts\test-agendamento-n8n.ps1"
Write-Host ""
Write-Host "Backend .env: N8N_URL=http://localhost:5678"
