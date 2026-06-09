#!/usr/bin/env bash
set -euo pipefail

# Migração segura de schema (Prisma) com backup prévio.
# Uso:
#   bash scripts/db_migrate_safe.sh

echo "1) Backup pre-migracao"
bash scripts/db_backup.sh

echo "2) Aplicando migracoes Prisma no backend"
docker compose -f infra/docker-compose.prod.yml --env-file infra/.env.production exec backend npm run db:migrate

echo "3) Gerando cliente Prisma atualizado"
docker compose -f infra/docker-compose.prod.yml --env-file infra/.env.production exec backend npm run db:generate

echo "Migracao concluida com sucesso."
