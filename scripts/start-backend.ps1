# Terminal 1 — Backend Casa da Paz
$ErrorActionPreference = "Stop"
$root = Split-Path $PSScriptRoot -Parent

. "$PSScriptRoot\setup-path.ps1"

Set-Location "$root\infra"

$composeDb = @("-f", "docker-compose.yml")
if (Test-Path "$root\infra\docker-compose.override.yml") {
  $composeDb += @("-f", "docker-compose.override.yml")
}

docker compose @composeDb up -d db
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Start-Sleep -Seconds 3

Set-Location "$root\backend"
if (-not (Test-Path .env)) { Copy-Item .env.example .env }

. "$PSScriptRoot\setup-path.ps1"

# Ajusta só DATABASE_URL se existir docker-compose.override.yml (ex.: 5437 neste PC)
$override = "$root\infra\docker-compose.override.yml"
if (Test-Path $override) {
  $content = Get-Content $override -Raw
  if ($content -match '"(\d+):5432"') {
    $port = $Matches[1]
    $envLines = Get-Content .env
    $envLines = $envLines | ForEach-Object {
      if ($_ -match '^DATABASE_URL=') {
        $_ -replace '@localhost:\d+/', "@localhost:$port/"
      } else {
        $_
      }
    }
    $envLines | Set-Content .env
    Write-Host "DATABASE_URL ajustado para porta $port (override local)"
  }
}

npm install
npx prisma migrate deploy
npm run db:seed
npm run dev
