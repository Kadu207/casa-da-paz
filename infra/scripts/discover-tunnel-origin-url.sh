#!/usr/bin/env bash
# Descobre URL de origem que o cloudflared Docker alcança (rede Swarm network_public)
set -euo pipefail

PORT="${HOST_HTTP_PORT:-9080}"
CF=$(docker ps --format '{{.Names}}' | grep -i cloudflared | head -1 || true)

if [ -z "$CF" ]; then
  echo "ERRO: container cloudflared não encontrado."
  exit 1
fi

echo "Cloudflared: $CF"
echo "Testando origens na porta $PORT ..."
echo ""

try_url() {
  local url="$1"
  if docker exec "$CF" sh -c "wget -qO- '$url/health' 2>/dev/null || curl -sf '$url/health' 2>/dev/null"; then
    echo "OK  $url"
    return 0
  fi
  echo "FAIL $url"
  return 1
}

HOST_IP=$(curl -sf ifconfig.me 2>/dev/null || echo "128.140.77.31")
CANDIDATES=(
  "http://172.17.0.1:${PORT}"
  "http://host.docker.internal:${PORT}"
  "http://${HOST_IP}:${PORT}"
  "http://128.140.77.31:${PORT}"
)

FOUND=""
for u in "${CANDIDATES[@]}"; do
  if try_url "$u"; then
    FOUND="$u"
    break
  fi
done

echo ""
if [ -n "$FOUND" ]; then
  echo "=== Use no Cloudflare (Public Hostname → Service URL) ==="
  echo "  $FOUND"
  echo ""
  echo "Requer HOST_BIND=0.0.0.0 em infra/.env.production + redeploy."
else
  echo "Nenhuma origem respondeu. Ajuste infra/.env.production:"
  echo "  HOST_BIND=0.0.0.0"
  echo "  HOST_HTTP_PORT=${PORT}"
  echo "Depois: CASADAPAZ_DEPLOY_CONFIRMED=yes ./scripts/deploy.sh"
  echo "E rode este script novamente."
  exit 1
fi
