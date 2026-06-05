# Runbook — Deploy VPS Hetzner

> **Guia detalhado:** [deploy-vps-passo-a-passo.md](./deploy-vps-passo-a-passo.md)

## Pré-requisitos
- [ ] Usuário confirmou deploy explicitamente
- [ ] SSH na VPS Hetzner
- [ ] DNS Cloudflare configurado (ver `infra/cloudflare-dns.md`)
- [ ] Secrets: `DB_PASSWORD`, `JWT_SECRET` na VPS

## Passos
1. `git pull origin main`
2. `cd frontend && npm ci && npm run build`
3. `cd ../infra`
4. `CASADAPAZ_DEPLOY_CONFIRMED=yes ./scripts/deploy.sh`
5. Smoke test: `curl https://casadapaz.inovatitech.com.br/health`

## Rollback
`docker compose -f docker-compose.prod.yml down`
Restaurar volume `pgdata` do backup se necessário.
