#!/usr/bin/env bash
# Build frontend/dist na VPS sem Node no host (usa imagem node:22-alpine).
# Uso (na VPS):
#   cd ~/casadapaz/infra
#   chmod +x scripts/build-frontend-on-vps.sh
#   ./scripts/build-frontend-on-vps.sh
#   ./scripts/compose-prod.sh restart frontend
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
FE="$ROOT/frontend"

if [ ! -f "$FE/package.json" ]; then
  echo "ERRO: $FE/package.json ausente"
  exit 1
fi

echo "=== Build frontend em Docker (node:22-alpine) ==="
docker run --rm \
  -v "$FE:/app" \
  -w /app \
  node:22-alpine \
  sh -c 'npm ci && npm run build'

DIST="$FE/dist/index.html"
if [ ! -f "$DIST" ]; then
  echo "ERRO: dist/index.html não gerado"
  exit 1
fi

echo "OK: $(wc -c < "$DIST") bytes em frontend/dist/index.html"
ls -la "$FE/dist/assets"/index-*.js 2>/dev/null | head -3 || true

cd "$(dirname "$0")/.."
./scripts/verify-frontend-dist.sh
./scripts/fix-frontend-permissions.sh

echo ""
echo "Reinicie o frontend:"
echo "  ./scripts/compose-prod.sh restart frontend"
