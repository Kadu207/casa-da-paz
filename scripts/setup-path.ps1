# Carrega Node.js no PATH desta sessão do PowerShell
# Execute no início de cada terminal:  . .\scripts\setup-path.ps1

$nodeDir = "C:\Program Files\nodejs"
if (-not (Test-Path "$nodeDir\npm.cmd")) {
    Write-Host "ERRO: Node.js não encontrado em $nodeDir" -ForegroundColor Red
    Write-Host "Instale com: winget install OpenJS.NodeJS.LTS" -ForegroundColor Yellow
    Write-Host "Depois FECHE e REABRA o terminal." -ForegroundColor Yellow
    exit 1
}

$env:Path = "$nodeDir;" + $env:Path
Write-Host "OK: Node $(node -v) | npm $(npm -v)" -ForegroundColor Green
