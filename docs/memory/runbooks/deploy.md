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
2. FE: `./scripts/build-frontend-on-vps.sh` **ou** build local + sync
3. `cd infra`
4. `CASADAPAZ_DEPLOY_CONFIRMED=yes ./scripts/deploy.sh`
5. `./scripts/compose-prod.sh exec -T backend npx prisma migrate deploy`
6. Se nginx/CSP mudou: `./scripts/compose-prod.sh up -d --force-recreate frontend`
7. Conferir UI: **Galeria** (Público/Privado + álbuns) · Delegações · Estoque · Financeiro → Patrocínios · Cadastros  
   APIs: `/health`, `/api/public/galeria`, `/api/public/galeria/albuns`
8. Seeds idempotentes (sem destroy):  
   `./scripts/compose-prod.sh exec backend npx tsx prisma/seed.ts --estoque-casa-only`  
   `./scripts/compose-prod.sh exec backend npx tsx prisma/seed.ts --funcoes-casa-only`  
   `./scripts/compose-prod.sh exec -T backend npx tsx prisma/seed.ts --galeria-policies-034`  
   **Não** rodar seed completo destroy em produção.

## Pós-deploy útil
- Auditoria: `.\scripts\smoke-audit-f01-f10-prod.ps1`
- Secrets: `./scripts/check-prod-secrets.sh`
- N8N 033: `./scripts/setup-n8n-delegacao-vps.sh`

## Rollback
`docker compose -f docker-compose.prod.yml down`
Restaurar volume `pgdata` do backup se necessário.
