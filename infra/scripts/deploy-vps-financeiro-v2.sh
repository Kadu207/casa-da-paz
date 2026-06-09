#!/usr/bin/env bash
# Deploy financeiro v2 na VPS: backup → pull → build frontend → deploy → smoke tests
# Uso (na VPS, após git push do commit financeiro v2):
#   cd ~/casadapaz/infra
#   chmod +x scripts/deploy-vps-financeiro-v2.sh
#   CASADAPAZ_DEPLOY_CONFIRMED=yes ./scripts/deploy-vps-financeiro-v2.sh
#
# Variáveis opcionais:
#   ADMIN_LOGIN=admin ADMIN_SENHA=...  — smoke test autenticado
#   SKIP_FRONTEND_BUILD=1              — pula npm ci/build (dist já enviado do PC)
#   SKIP_BACKUP=1                      — pula backup (não recomendado)

set -euo pipefail

if [ "${CASADAPAZ_DEPLOY_CONFIRMED:-}" != "yes" ]; then
  echo "========================================"
  echo " DEPLOY BLOQUEADO"
  echo " Confirme e rode:"
  echo " CASADAPAZ_DEPLOY_CONFIRMED=yes ./scripts/deploy-vps-financeiro-v2.sh"
  echo "========================================"
  exit 1
fi

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
INFRA="$(cd "$(dirname "$0")/.." && pwd)"
PORT="${HOST_HTTP_PORT:-9080}"
ADMIN_LOGIN="${ADMIN_LOGIN:-admin}"
ADMIN_SENHA="${ADMIN_SENHA:-}"

cd "$ROOT"

echo "== 1/6 Backup do banco =="
if [ "${SKIP_BACKUP:-}" != "1" ]; then
  bash scripts/db_backup.sh
else
  echo "SKIP_BACKUP=1 — backup ignorado"
fi

echo "== 2/6 Atualizar código =="
git fetch origin main
git checkout -- infra/scripts/deploy.sh infra/scripts/deploy-vps-financeiro-v2.sh 2>/dev/null || true
git pull origin main

echo "== 3/6 Build frontend =="
if [ "${SKIP_FRONTEND_BUILD:-}" != "1" ]; then
  cd "$ROOT/frontend"
  npm ci
  npm run build
  test -f dist/index.html
  cd "$INFRA"
  chmod +x scripts/verify-frontend-dist.sh scripts/fix-frontend-permissions.sh 2>/dev/null || true
  ./scripts/verify-frontend-dist.sh
else
  echo "SKIP_FRONTEND_BUILD=1 — usando dist existente"
fi

echo "== 4/6 Deploy Docker (migration financeiro_v2 via backend entrypoint) =="
cd "$INFRA"
chmod +x scripts/*.sh 2>/dev/null || true
CASADAPAZ_DEPLOY_CONFIRMED=yes ./scripts/deploy.sh

echo "== 5/6 Status das migrations =="
./scripts/compose-prod.sh exec backend npx prisma migrate status

echo "== 6/6 Smoke tests =="
HEALTH=$(curl -sf "http://127.0.0.1:${PORT}/health" || echo FAIL)
echo "Health: $HEALTH"

PUBLIC=$(curl -sf -o /dev/null -w '%{http_code}' "http://127.0.0.1:${PORT}/api/public/eventos")
echo "GET /api/public/eventos: HTTP $PUBLIC"

if [ -n "$ADMIN_SENHA" ]; then
  TOKEN=$(curl -sf -X POST "http://127.0.0.1:${PORT}/api/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"login\":\"${ADMIN_LOGIN}\",\"senha\":\"${ADMIN_SENHA}\"}" | sed -n 's/.*"token":"\([^"]*\)".*/\1/p')
  if [ -n "$TOKEN" ]; then
    FLUXO=$(curl -sf "http://127.0.0.1:${PORT}/api/financeiro/fluxo-caixa?mes=6&ano=2026" \
      -H "Authorization: Bearer $TOKEN" | head -c 200)
    echo "GET /api/financeiro/fluxo-caixa: ${FLUXO}..."
    LIST=$(curl -sf "http://127.0.0.1:${PORT}/api/financeiro?page=1&limit=5" \
      -H "Authorization: Bearer $TOKEN" | head -c 200)
    echo "GET /api/financeiro?page=1: ${LIST}..."
  else
    echo "AVISO: login falhou — defina ADMIN_SENHA para smoke autenticado"
  fi
else
  echo "Dica: ADMIN_SENHA=... para testar /api/financeiro/fluxo-caixa"
fi

echo ""
echo "Deploy financeiro v2 concluído."
echo "  ERP: https://casadapaz.inovatitech.com.br/login"
echo "  Cloudflare: purge cache se assets antigos persistirem"
