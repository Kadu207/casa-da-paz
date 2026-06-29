param(
  [string]$DbContainer = "infra-db-1",
  [string]$DbUser = "admin_casadapaz",
  [string]$DbName = "casadapaz_db",
  [string]$OutputDir = ".\\backups"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

if (-not (Test-Path -LiteralPath $OutputDir)) {
  New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null
}

$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$gzipCmd = Get-Command gzip -ErrorAction SilentlyContinue

if ($null -ne $gzipCmd) {
  $outFile = Join-Path $OutputDir "casadapaz-db-$stamp.sql.gz"
  Write-Host "Gerando backup compactado em: $outFile"
  docker exec -i $DbContainer pg_dump -U $DbUser $DbName | gzip > $outFile
  if ($LASTEXITCODE -ne 0) {
    throw "Falha ao gerar backup compactado via docker/pg_dump."
  }
}
else {
  $outFile = Join-Path $OutputDir "casadapaz-db-$stamp.sql"
  Write-Host "gzip nao encontrado. Gerando backup SQL em: $outFile"
  docker exec -i $DbContainer pg_dump -U $DbUser $DbName | Out-File -FilePath $outFile -Encoding utf8
  if ($LASTEXITCODE -ne 0) {
    throw "Falha ao gerar backup SQL via docker/pg_dump."
  }
}

Write-Host "Backup concluido."
