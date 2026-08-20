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
| Deploy 031 backend | ✅ migrate 22 + seed catálogo + health OK (`619e694`) |
| Deploy 031 frontend | ⏳ PC→VPS SSH `:65022` timeout — build na VPS com Docker |
| SSH do PC | Timeout em `128.140.77.31:65022` (firewall Hetzner/ISP ou allowlist) |

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

Se SSH do PC der **timeout** (comum se a porta 65022 só aceita IPs allowlist / console Hetzner),
builde **na própria VPS** (não precisa npm no host):

```bash
cd ~/casadapaz
git pull origin main
cd infra
chmod +x scripts/build-frontend-on-vps.sh
./scripts/build-frontend-on-vps.sh
./scripts/compose-prod.sh restart frontend
curl -sI http://127.0.0.1:9080/login | head -3
```

### Diagnóstico SSH timeout do PC

```bash
# Na VPS — quem escuta e regras
sudo ss -tlnp | grep 65022
sudo iptables -L INPUT -n -v | head -40
# Hetzner Cloud Console → Firewall: porta 65022/tcp liberada para seu IP público?
```

Do PC: `Test-NetConnection 128.140.77.31 -Port 65022`  
Timeout = bloqueio de rede (não é senha/script).