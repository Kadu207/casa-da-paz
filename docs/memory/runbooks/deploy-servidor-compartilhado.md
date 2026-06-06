# Proxy no nginx do HOST — servidor compartilhado (inovati-server)

Quando **80/443 já servem outro site** (ex.: Excellence Dental), o Casa da Paz roda em **Docker na porta 9080** (localhost) e o **nginx do host** encaminha o subdomínio.

## 1. `.env.production` (PC → VPS)

No PC (Windows), após editar `infra\.env.production`:

```powershell
.\scripts\sync-env-vps.ps1
```

Ou:

```powershell
scp "infra\.env.production" gestaoti@128.140.77.31:~/casadapaz/infra/.env.production
```

Conteúdo mínimo:

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
git pull origin main
cd infra
chmod +x scripts/*.sh
CASADAPAZ_DEPLOY_CONFIRMED=yes ./scripts/deploy.sh
```

Teste local:

```bash
curl -s http://127.0.0.1:9080/health
```

## 3. Proxy nginx no HOST (obrigatório para HTTPS público)

Sem este passo, `casadapaz.inovatitech.com.br` cai no site padrão da VPS (ex.: Excellence Dental).

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

## 4. Acesso temporário (trocar senha antes do vhost)

A porta **9080** só escuta em `127.0.0.1` — não abre no navegador externo (`ERR_CONNECTION_REFUSED` é esperado).

No **Windows** (PowerShell), túnel SSH:

```powershell
ssh -L 9080:127.0.0.1:9080 gestaoti@128.140.77.31
```

Deixe a janela aberta e acesse no browser: **http://localhost:9080/login**  
Login: `admin` / `admin123` → `/app/minha-senha`

## 5. Cloudflare

- DNS **A** `casadapaz` → IP da VPS (proxy laranja)
- SSL/TLS → **Full (strict)**

## 6. Seed

```bash
cd ~/casadapaz/infra
./scripts/compose-prod.sh exec backend npx prisma db seed
```

## Diagnóstico

```bash
sudo ss -tlnp | grep -E ':80|:443|:9080'
docker ps
./scripts/compose-prod.sh ps
curl -s http://127.0.0.1:9080/health
curl -sI https://casadapaz.inovatitech.com.br/health
```

**Comandos úteis** (sempre com env carregado):

```bash
./scripts/compose-prod.sh down
./scripts/compose-prod.sh up -d
./scripts/compose-prod.sh logs -f backend
```
