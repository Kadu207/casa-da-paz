#!/usr/bin/env bash
# Wrapper: sempre carrega .env.production (evita WARN DB_PASSWORD/JWT_SECRET vazios)
set -euo pipefail

INFRA_DIR="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="${INFRA_DIR}/.env.production"
COMPOSE_FILE="${INFRA_DIR}/docker-compose.prod.yml"

if [ ! -f "$ENV_FILE" ]; then
  echo "ERRO: ${ENV_FILE} não encontrado."
  echo "      Copie .env.production.example → .env.production e preencha os valores."
  exit 1
fi

exec docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" "$@"
