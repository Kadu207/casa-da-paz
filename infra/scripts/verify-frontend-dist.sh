#!/usr/bin/env bash
# Valida frontend/dist antes do deploy (evita nginx 500 por index.html ausente)
set -euo pipefail

DIST="../frontend/dist/index.html"
if [ ! -f "$DIST" ]; then
  echo "ERRO: frontend/dist/index.html ausente."
  echo "      cd ~/casadapaz/frontend && npm ci && npm run build"
  exit 1
fi

if ! grep -q "Casa da Paz" "$DIST" 2>/dev/null; then
  echo "AVISO: index.html não parece ser do Casa da Paz — rebuild recomendado."
fi

echo "OK: frontend/dist pronto ($(wc -c < "$DIST") bytes)"
