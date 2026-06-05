#!/usr/bin/env bash
# GATE HUMANO — Não executar sem confirmação explícita do usuário
set -euo pipefail

if [ "${CASADAPAZ_DEPLOY_CONFIRMED:-}" != "yes" ]; then
  echo "========================================"
  echo " DEPLOY BLOQUEADO"
  echo " Para executar, confirme com o usuário e rode:"
  echo " CASADAPAZ_DEPLOY_CONFIRMED=yes ./scripts/deploy.sh"
  echo " Guia: docs/memory/runbooks/deploy-vps-passo-a-passo.md"
  echo "========================================"
  exit 1
fi

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$(dirname "$0")/.."

if [ ! -f "../frontend/dist/index.html" ]; then
  echo "ERRO: frontend/dist ausente. Rode: cd frontend && npm ci && npm run build"
  exit 1
fi

if [ ! -f "nginx/ssl/origin.pem" ] || [ ! -f "nginx/ssl/origin-key.pem" ]; then
  echo "AVISO: Certificados SSL não encontrados em infra/nginx/ssl/"
  echo "       Configure Cloudflare Origin Certificate antes do HTTPS."
fi

if [ -f ".env.production" ]; then
  set -a
  # shellcheck source=/dev/null
  source .env.production
  set +a
elif [ -z "${DB_PASSWORD:-}" ] || [ -z "${JWT_SECRET:-}" ]; then
  echo "ERRO: Defina DB_PASSWORD e JWT_SECRET (.env.production ou export)"
  exit 1
fi

docker compose -f docker-compose.prod.yml up -d --build
echo ""
echo "Deploy concluído."
echo "  Health: curl -s https://casadapaz.inovatitech.com.br/health"
echo "  Seed (1ª vez): docker compose -f docker-compose.prod.yml exec backend npx prisma db seed"
