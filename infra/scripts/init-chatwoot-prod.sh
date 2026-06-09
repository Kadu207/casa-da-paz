#!/usr/bin/env bash
# Primeira instalação Chatwoot em produção (cria chatwoot_db + schema)
set -euo pipefail

INFRA_DIR="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="${INFRA_DIR}/.env.production"

if [ ! -f "$ENV_FILE" ]; then
  echo "ERRO: .env.production ausente"
  exit 1
fi

# shellcheck disable=SC1090
set -a && source "$ENV_FILE" && set +a

echo "Criando banco chatwoot_db (se não existir)..."
docker compose --env-file "$ENV_FILE" -f "${INFRA_DIR}/docker-compose.prod.yml" exec -T db \
  psql -U admin_casadapaz -d casadapaz_db -tc \
  "SELECT 1 FROM pg_database WHERE datname = 'chatwoot_db'" | grep -q 1 \
  || docker compose --env-file "$ENV_FILE" -f "${INFRA_DIR}/docker-compose.prod.yml" exec -T db \
  psql -U admin_casadapaz -d casadapaz_db -c "CREATE DATABASE chatwoot_db;"

echo "Preparando schema Chatwoot..."
"${INFRA_DIR}/scripts/compose-prod-messaging.sh" run --rm chatwoot bundle exec rails db:chatwoot_prepare

echo "OK — acesse Chatwoot (túnel/Cloudflare) e crie inbox + website token."
