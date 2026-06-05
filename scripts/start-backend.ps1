# Terminal 1 — Backend Casa da Paz
$ErrorActionPreference = "Stop"
$root = Split-Path $PSScriptRoot -Parent

. "$PSScriptRoot\setup-path.ps1"

Set-Location "$root\infra"
docker compose up -d db
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Start-Sleep -Seconds 3

Set-Location "$root\backend"
if (-not (Test-Path .env)) { Copy-Item .env.example .env }

npm install
npx prisma db push
npm run db:seed
npm run dev
