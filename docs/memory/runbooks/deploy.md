# Runbook — Deploy VPS Hetzner

> **Guia detalhado:** [deploy-vps-passo-a-passo.md](./deploy-vps-passo-a-passo.md)  
> **Estado atual / bloqueios:** [`.specify/memory/project-memory.md`](../../../.specify/memory/project-memory.md)

## Pré-requisitos
- [ ] Usuário confirmou deploy explicitamente
- [ ] Código em `main` (GitHub + GitLab) — push dual feito
- [ ] SSH na VPS Hetzner (chave ou senha no **terminal local** do usuário)
- [ ] DNS Cloudflare configurado (ver `infra/cloudflare-dns.md`)
- [ ] Secrets: `DB_PASSWORD`, `JWT_SECRET` na VPS

## Passos
1. `git pull origin main`
2. `cd frontend && npm ci && npm run build`
3. `cd ../infra`
4. `CASADAPAZ_DEPLOY_CONFIRMED=yes ./scripts/deploy.sh`
5. Conferir UI: Financeiro → Patrocínios / Padrinhos · **Estoque** (`/app/estoque`) · Cadastros → Médiuns
6. Catálogo estoque (idempotente, sem apagar dados):  
   `./scripts/compose-prod.sh exec backend npx tsx prisma/seed.ts --estoque-casa-only`  
   **Não** rodar seed completo destroy em produção.

## Rollback
`docker compose -f docker-compose.prod.yml down`
Restaurar volume `pgdata` do backup se necessário.
