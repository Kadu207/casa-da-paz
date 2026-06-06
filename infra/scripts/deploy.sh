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

chmod +x scripts/verify-frontend-dist.sh scripts/fix-frontend-permissions.sh 2>/dev/null || true
./scripts/verify-frontend-dist.sh
./scripts/fix-frontend-permissions.sh

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

chmod +x scripts/compose-prod.sh 2>/dev/null || true
./scripts/compose-prod.sh up -d --build
PORT="${HOST_HTTP_PORT:-9080}"
echo ""
echo "Deploy concluído."
echo "  Porta HTTP interna: ${PORT} (127.0.0.1 — não usa 80/443 do host)"
echo "  Health local: curl -s http://127.0.0.1:${PORT}/health"
echo "  Health público: curl -s https://casadapaz.inovatitech.com.br/health"
echo "  Seed (1ª vez): ./scripts/compose-prod.sh exec backend npx prisma db seed"
if [ "${NGINX_CONF:-prod.conf}" = "prod-internal.conf" ]; then
  echo ""
  echo "  Modo servidor compartilhado (porta ${PORT}). Instale o proxy no nginx do host:"
  echo "  sudo ./scripts/install-host-nginx.sh"
  echo "  docs/memory/runbooks/deploy-servidor-compartilhado.md"
fi
