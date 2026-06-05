#!/usr/bin/env bash
# GATE HUMANO — Não executar sem confirmação explícita do usuário
set -euo pipefail

if [ "${CASADAPAZ_DEPLOY_CONFIRMED:-}" != "yes" ]; then
  echo "========================================"
  echo " DEPLOY BLOQUEADO"
  echo " Para executar, confirme com o usuário e rode:"
  echo " CASADAPAZ_DEPLOY_CONFIRMED=yes ./deploy.sh"
  echo "========================================"
  exit 1
fi

cd "$(dirname "$0")/.."
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d --build
echo "Deploy concluído. Verifique https://casadapaz.inovatitech.com.br"
