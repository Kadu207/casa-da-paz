#!/usr/bin/env bash
# Testa origens a partir do HOST (cloudflared Swarm é imagem distless — sem sh/curl)
set -euo pipefail

cd "$(dirname "$0")"
PORT="${HOST_HTTP_PORT:-9080}"

echo "=== .env.production ==="
grep -E '^(HOST_BIND|HOST_HTTP_PORT)=' .env.production 2>/dev/null || echo "(arquivo não encontrado)"

echo ""
echo "=== Porta publicada (deve ser 0.0.0.0:9080, NÃO 127.0.0.1) ==="
docker ps --filter name=infra-frontend --format '{{.Names}} {{.Ports}}'

BIND=$(grep '^HOST_BIND=' .env.production 2>/dev/null | cut -d= -f2 || echo "")
if [ "$BIND" = "127.0.0.1" ]; then
  echo ""
  echo "ERRO: HOST_BIND=127.0.0.1 — cloudflared Docker não alcança."
  echo "      nano .env.production  →  HOST_BIND=0.0.0.0"
  echo "      CASADAPAZ_DEPLOY_CONFIRMED=yes ./scripts/deploy.sh"
  exit 1
fi

echo ""
echo "=== Teste HTTP a partir do host (porta $PORT) ==="

try() {
  local url="$1"
  if curl -sf --max-time 3 "${url}/health" >/dev/null 2>&1; then
    echo "OK   $url"
    echo "$url"
    return 0
  fi
  echo "FAIL $url"
  return 1
}

FOUND=""
for url in \
  "http://127.0.0.1:${PORT}" \
  "http://172.17.0.1:${PORT}" \
  "http://128.140.77.31:${PORT}"; do
  if out=$(try "$url"); then
    FOUND="$out"
    break
  fi
done

echo ""
if [ -n "$FOUND" ]; then
  echo "=========================================="
  echo " Cloudflare → Public Hostname → Service:"
  echo "   Type: HTTP"
  echo "   URL:  $FOUND"
  echo ""
  echo " Se o painel rejeitar, tente SEM http://:"
  echo "   128.140.77.31:${PORT}"
  echo "   ou campos separados: Host 128.140.77.31  Port ${PORT}"
  echo "=========================================="
else
  echo "Nenhuma URL respondeu. Confira HOST_BIND=0.0.0.0 e redeploy."
  exit 1
fi
