#!/usr/bin/env bash
# Importa workflows N8N no container de produção
set -euo pipefail

INFRA_DIR="$(cd "$(dirname "$0")/.." && pwd)"
REPO_ROOT="$(cd "${INFRA_DIR}/.." && pwd)"
WORKFLOWS_DIR="${REPO_ROOT}/infra/n8n/workflows"
COMPOSE="${INFRA_DIR}/scripts/compose-prod-messaging.sh"

if ! $COMPOSE ps -q n8n | grep -q .; then
  echo "Container n8n não está rodando. Execute: ./scripts/compose-prod-messaging.sh up -d n8n"
  exit 1
fi

N8N_ID=$($COMPOSE ps -q n8n)
IMPORT_DIR="/tmp/n8n-workflows-import-$(date +%Y%m%d%H%M%S)"

echo "Copiando workflows..."
docker exec -u root "$N8N_ID" rm -rf /tmp/n8n-workflows 2>/dev/null || true
docker cp "$WORKFLOWS_DIR" "$N8N_ID:${IMPORT_DIR}"

echo "Importando..."
docker exec "$N8N_ID" n8n import:workflow --separate --input="${IMPORT_DIR}"

echo "Publicando..."
while IFS= read -r line; do
  id="${line%%|*}"
  if [[ "$line" == *"Casa da Paz"* ]]; then
    docker exec "$N8N_ID" n8n publish:workflow --id="$id" || true
  fi
done < <(docker exec "$N8N_ID" n8n list:workflow 2>/dev/null || true)

docker exec -u root "$N8N_ID" rm -rf "${IMPORT_DIR}" 2>/dev/null || true

echo "Reiniciando n8n..."
$COMPOSE restart n8n

echo "Webhooks internos (backend → n8n):"
echo "  POST http://n8n:5678/webhook/casadapaz-agendamento"
echo "  POST http://n8n:5678/webhook/casadapaz-agendamento-confirmado"
echo "  POST http://n8n:5678/webhook/casadapaz-agendamento-cancelado"
echo "  POST http://n8n:5678/webhook/casadapaz-lembrete-atraso"
echo "  POST http://n8n:5678/webhook/casadapaz-recibo-pago"
echo "  POST http://n8n:5678/webhook/casadapaz-ingresso-oficina"
