# Terminal 2 — Frontend Casa da Paz
$ErrorActionPreference = "Stop"
$root = Split-Path $PSScriptRoot -Parent

. "$PSScriptRoot\setup-path.ps1"

Set-Location "$root\frontend"
npm install
npm run dev
