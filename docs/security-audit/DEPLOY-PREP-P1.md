# Prep deploy VPS — segurança P1 (`6e215ab`)

**Status:** código em `main` (push dual). Deploy **não** executado — aguarda confirmação.

## Gate
Só rodar com: `CASADAPAZ_DEPLOY_CONFIRMED=yes`

## Na VPS (SSH porta 65025)

```bash
ssh -p 65025 gestaoti@128.140.77.31

cd ~/casadapaz
git fetch origin
git checkout main
git pull origin main

# Verificar se JWT/N8N não são defaults fracos (denylist expandida)
cd infra
./scripts/check-prod-secrets.sh

# Backend (rebuild)
CASADAPAZ_DEPLOY_CONFIRMED=yes ./scripts/deploy.sh
# Se frontend dist já existir no volume/host: o script sobe compose --build.
# Se FE precisar rebuild na VPS (sem Node no host):
#   ./scripts/build-frontend-on-vps.sh
#   ./scripts/compose-prod.sh restart frontend

# Smoke
curl -s https://casadapaz.inovatitech.com.br/health
```

## Smoke segurança (pós-deploy)

1. Login MEDIUM (`financeiro:own`): `GET /api/financeiro?pessoaId=<outro>` → só dados próprios (não lista alheia).
2. Responsável limpeza: `POST /api/estoque-casa/itens` → 403; checklist do próprio grupo → OK.
3. Confirmar container backend subiu (sem crash por `JWT_SECRET`/`N8N_WEBHOOK_SECRET` fracos).

## Rollback
`git -C ~/casadapaz log -1 --oneline` → voltar commit anterior + `CASADAPAZ_DEPLOY_CONFIRMED=yes ./scripts/deploy.sh`
