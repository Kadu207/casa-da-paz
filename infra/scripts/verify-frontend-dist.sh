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

if ! grep -q '/assets/index-' "$DIST" 2>/dev/null; then
  echo "ERRO: index.html sem bundle /assets/index-*.js — rebuild incompleto."
  exit 1
fi

ASSETS_DIR="../frontend/dist/assets"
if [ ! -d "$ASSETS_DIR" ] || [ -z "$(find "$ASSETS_DIR" -name 'index-*.js' -size +100k 2>/dev/null | head -1)" ]; then
  echo "ERRO: bundle JS ausente ou muito pequeno em frontend/dist/assets/"
  echo "      Rode no PC: .\\scripts\\build-frontend-prod.ps1 && .\\scripts\\sync-frontend-vps.ps1"
  exit 1
fi

echo "OK: frontend/dist pronto ($(wc -c < "$DIST") bytes)"
