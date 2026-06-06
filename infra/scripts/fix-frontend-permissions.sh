#!/usr/bin/env bash
# Corrige permissões do frontend/dist (nginx no Docker roda como usuário nginx)
set -euo pipefail

DIST="$(cd "$(dirname "$0")/../.." && pwd)/frontend/dist"

if [ ! -d "$DIST" ]; then
  echo "ERRO: $DIST não encontrado"
  exit 1
fi

find "$DIST" -type d -exec chmod 755 {} \;
find "$DIST" -type f -exec chmod 644 {} \;
echo "OK: permissões em frontend/dist (755 dirs, 644 arquivos)"
