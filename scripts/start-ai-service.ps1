# Sobe ai-service (parse Excel + validação IA)
$ErrorActionPreference = "Stop"
$root = Split-Path $PSScriptRoot -Parent
Set-Location "$root\infra"
docker compose -f docker-compose.yml up -d ai-service
Write-Host "AI Service: http://localhost:8000/health"
