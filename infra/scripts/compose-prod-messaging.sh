#!/usr/bin/env bash
# Compose produção + mensageria (N8N, Chatwoot, Redis)
set -euo pipefail

INFRA_DIR="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="${INFRA_DIR}/.env.production"

if [ ! -f "$ENV_FILE" ]; then
  echo "ERRO: ${ENV_FILE} não encontrado."
  exit 1
fi

exec docker compose \
  --env-file "$ENV_FILE" \
  -f "${INFRA_DIR}/docker-compose.prod.yml" \
  -f "${INFRA_DIR}/docker-compose.prod.messaging.yml" \
  "$@"
