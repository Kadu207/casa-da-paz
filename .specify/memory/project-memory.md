# Memória Viva — Casa da Paz

**Última atualização:** 2026-08-20

## Estado do projeto

| Item | Status |
|------|--------|
| Fase | Pós-go-live: estoque primário 031 |
| Versão | 0.1.0-alpha |
| Commit | `79a6ace`+ (Docker Prisma fix; SSH port / tsconfig tests) |
| Produção | https://casadapaz.inovatitech.com.br |
| SSH VPS | `ssh -p 65022 gestaoti@128.140.77.31` (**não** :22) |
| Asaas (021) | **Dormant** |
| Deploy 031 | Em andamento — limpar testes órfãos na VPS + rebuild |

## Deploy VPS (colar)

```bash
cd ~/casadapaz
git fetch origin && git reset --hard origin/main
git clean -fd
chmod +x infra/scripts/*.sh

cd infra
docker compose --env-file .env.production -f docker-compose.prod.yml build --no-cache backend
CASADAPAZ_DEPLOY_CONFIRMED=yes ./scripts/deploy.sh
./scripts/compose-prod.sh exec -T backend npx prisma migrate deploy
./scripts/compose-prod.sh exec -T backend npx tsx prisma/seed.ts --estoque-casa-only
curl -s http://127.0.0.1:9080/health
```

Frontend (PC):

```powershell
cd "C:\Projetos DEV\Casa da Paz"
.\scripts\deploy-frontend-vps.ps1 -PasswordOnly -RestartFrontend -SshPort 65022
```
