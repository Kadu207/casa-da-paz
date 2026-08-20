# MemÃ³ria Viva â€” Casa da Paz

**Ãšltima atualizaÃ§Ã£o:** 2026-08-20

## Estado do projeto

| Item | Status |
|------|--------|
| Fase | PÃ³s-go-live: estoque primÃ¡rio 031 |
| VersÃ£o | 0.1.0-alpha |
| Commit | `79a6ace`+ (Docker Prisma fix; SSH port / tsconfig tests) |
| ProduÃ§Ã£o | https://casadapaz.inovatitech.com.br |
| SSH VPS | `ssh -p 65025 gestaoti@128.140.77.31` (**nÃ£o** :22) |
| Asaas (021) | **Dormant** |
| Deploy 031 backend | âœ… migrate 22 + seed catÃ¡logo + health OK |
| Deploy 031 frontend | âœ… build Docker na VPS â€” bundle `index-RuKfHPXy.js` HTTP 200 |
| SSH do PC | Timeout em `:65025` (allowlist/firewall); sync FE via Docker na VPS |

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
.\scripts\deploy-frontend-vps.ps1 -PasswordOnly -RestartFrontend
```

Se SSH do PC der **timeout** (comum se a porta 65025 sÃ³ aceita IPs allowlist / console Hetzner),
builde **na prÃ³pria VPS** (nÃ£o precisa npm no host):

```bash
cd ~/casadapaz
git pull origin main
cd infra
chmod +x scripts/build-frontend-on-vps.sh
./scripts/build-frontend-on-vps.sh
./scripts/compose-prod.sh restart frontend
curl -sI http://127.0.0.1:9080/login | head -3
```

### DiagnÃ³stico SSH timeout do PC

```bash
# Na VPS â€” quem escuta e regras
sudo ss -tlnp | grep 65025
sudo iptables -L INPUT -n -v | head -40
# Hetzner Cloud Console â†’ Firewall: porta 65025/tcp liberada para seu IP pÃºblico?
```

Do PC: `Test-NetConnection 128.140.77.31 -Port 65025`  
Timeout = bloqueio de rede (nÃ£o Ã© senha/script).