#!/usr/bin/env bash
# Primeira instalacao Chatwoot em producao (cria chatwoot_db + pgvector + schema)
set -euo pipefail

INFRA_DIR="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="${INFRA_DIR}/.env.production"
COMPOSE="${INFRA_DIR}/scripts/compose-prod-messaging.sh"

if [ ! -f "$ENV_FILE" ]; then
  echo "ERRO: .env.production ausente"
  exit 1
fi

echo "Criando banco chatwoot_db (se nao existir)..."
$COMPOSE exec -T db psql -U admin_casadapaz -d casadapaz_db -tc \
  "SELECT 1 FROM pg_database WHERE datname = 'chatwoot_db'" | grep -q 1 \
  || $COMPOSE exec -T db psql -U admin_casadapaz -d casadapaz_db -c "CREATE DATABASE chatwoot_db;"

echo "Habilitando extensao pgvector em chatwoot_db..."
if ! $COMPOSE exec -T db psql -U admin_casadapaz -d chatwoot_db -c "CREATE EXTENSION IF NOT EXISTS vector;"; then
  echo ""
  echo "ERRO: extensao vector indisponivel no Postgres."
  echo "      git pull e recrie o servico db (imagem pgvector/pgvector:pg16):"
  echo "      ./scripts/compose-prod-messaging.sh pull db"
  echo "      ./scripts/compose-prod-messaging.sh up -d db"
  exit 1
fi

echo "Preparando schema Chatwoot..."
$COMPOSE run --rm chatwoot bundle exec rails db:chatwoot_prepare

echo "Reiniciando Chatwoot..."
$COMPOSE up -d chatwoot chatwoot-sidekiq

echo ""
echo "Teste local:"
echo "  curl -s -o /dev/null -w 'HTTP %{http_code}\n' http://127.0.0.1:\${CHATWOOT_PORT:-3001}"
echo "OK — configure Cloudflare chat -> http://172.17.0.1:3001 e crie inbox + website token."
