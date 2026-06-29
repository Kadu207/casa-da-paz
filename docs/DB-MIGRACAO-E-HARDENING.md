# DB migracao e hardening (Casa da Paz)

## Objetivo
Aplicar melhorias de banco e seguranca sem interromper operacao.

## Fluxo seguro
1. Subir stack de producao/hml:
   - `docker compose -f infra/docker-compose.prod.yml --env-file infra/.env.production up -d --build`
2. Backup pre-migracao:
   - `bash scripts/db_backup.sh`
   - ou `./scripts/db_backup.ps1`
3. Migracao Prisma segura:
   - `bash scripts/db_migrate_safe.sh`
   - ou `./scripts/db_migrate_safe.ps1`
4. Smoke de API:
   - login, autorizacao RBAC, metricas, auditoria e rotas publicas.

## Hardening aplicado nesta rodada
- Pipeline alinhado ao stack Node (backend + frontend).
- Auditoria de dependencias (`npm audit`) em modo transicao.
- Remocao de segredos hardcoded de exemplo no backend.

## Proximo passo
- Após estabilizar findings, tornar `npm audit` bloqueante em release.
- Adicionar varredura de imagem Docker para o deploy da VPS.
