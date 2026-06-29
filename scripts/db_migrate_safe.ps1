Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

Write-Host "1) Backup pre-migracao"
& ".\\scripts\\db_backup.ps1"

Write-Host "2) Aplicando migracoes Prisma no backend"
docker compose -f infra/docker-compose.prod.yml --env-file infra/.env.production exec backend npm run db:migrate
if ($LASTEXITCODE -ne 0) {
  throw "Falha ao aplicar prisma migrate deploy."
}

Write-Host "3) Gerando cliente Prisma atualizado"
docker compose -f infra/docker-compose.prod.yml --env-file infra/.env.production exec backend npm run db:generate
if ($LASTEXITCODE -ne 0) {
  throw "Falha ao gerar Prisma client apos migracao."
}

Write-Host "Migracao concluida com sucesso."
