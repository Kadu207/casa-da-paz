# Proxy no nginx do HOST â€” servidor compartilhado (inovati-server)

**SSH:** `ssh -p 65025 gestaoti@128.140.77.31` (porta **65025**, nÃ£o 22).

Quando **80/443 jÃ¡ servem outro site** (ex.: Excellence Dental), o Casa da Paz roda em **Docker na porta 9080** (localhost) e o **nginx do host** encaminha o subdomÃ­nio.

## 1. `.env.production` (PC â†’ VPS)

No PC (Windows), apÃ³s editar `infra\.env.production`:

```powershell
.\scripts\sync-env-vps.ps1
```

Ou:

```powershell
scp -P 65025 "infra\.env.production" gestaoti@128.140.77.31:~/casadapaz/infra/.env.production
```

ConteÃºdo mÃ­nimo:

```env
DB_PASSWORD=...
JWT_SECRET=...
NGINX_CONF=prod-internal.conf
HOST_BIND=127.0.0.1
HOST_HTTP_PORT=9080
```

## 2. Deploy na VPS

```bash
cd ~/casadapaz
git checkout -- infra/scripts/deploy.sh   # descarta ediÃ§Ã£o local que bloqueia pull
git pull origin main
cd frontend && npm ci && npm run build && cd ../infra
chmod +x scripts/*.sh
./scripts/verify-frontend-dist.sh
CASADAPAZ_DEPLOY_CONFIRMED=yes ./scripts/deploy.sh
sudo ./scripts/install-host-nginx.sh
```

Teste local:

```bash
curl -s http://127.0.0.1:9080/health
```

## 3. Proxy nginx no HOST (obrigatÃ³rio para HTTPS pÃºblico)

Sem este passo, `casadapaz.inovatitech.com.br` cai no site padrÃ£o da VPS (ex.: Excellence Dental).

```bash
cd ~/casadapaz
git pull origin main
cd infra
chmod +x scripts/*.sh
sudo ./scripts/install-host-nginx.sh
```

Testes:

```bash
curl -s -H "Host: casadapaz.inovatitech.com.br" http://127.0.0.1/health
curl -s https://casadapaz.inovatitech.com.br/health
curl -sI https://casadapaz.inovatitech.com.br/public | head -5
```

## 4. Acesso temporÃ¡rio (trocar senha antes do vhost)

A porta **9080** sÃ³ escuta em `127.0.0.1` â€” nÃ£o abre no navegador externo (`ERR_CONNECTION_REFUSED` Ã© esperado).

No **Windows** (PowerShell), tÃºnel SSH:

```powershell
ssh -p 65025 -L 9080:127.0.0.1:9080 gestaoti@128.140.77.31
```

Deixe a janela aberta e acesse no browser: **http://localhost:9080/login**  
Login: `admin` / `admin123` â†’ `/app/minha-senha`

## 5. Cloudflare

- DNS **A** `casadapaz` â†’ IP da VPS (proxy laranja)
- SSL/TLS â†’ **Full (strict)**

## 6. Seed

```bash
cd ~/casadapaz/infra
./scripts/compose-prod.sh exec backend npx prisma db seed
```

## DiagnÃ³stico

```bash
sudo ss -tlnp | grep -E ':80|:443|:9080'
docker ps
./scripts/compose-prod.sh ps
curl -s http://127.0.0.1:9080/health
curl -sI https://casadapaz.inovatitech.com.br/health
```

**Comandos Ãºteis** (sempre com env carregado):

```bash
./scripts/compose-prod.sh down
./scripts/compose-prod.sh up -d
./scripts/compose-prod.sh logs -f backend
```
