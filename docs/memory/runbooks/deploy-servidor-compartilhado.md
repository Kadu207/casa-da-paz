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

## 3. Certificados no HOST

```bash
sudo mkdir -p /etc/nginx/ssl/casadapaz
sudo cp ~/casadapaz/infra/nginx/ssl/origin.pem /etc/nginx/ssl/casadapaz/
sudo cp ~/casadapaz/infra/nginx/ssl/origin-key.pem /etc/nginx/ssl/casadapaz/
sudo chmod 600 /etc/nginx/ssl/casadapaz/*
```

## 4. Bloco nginx no host

Crie `/etc/nginx/sites-available/casadapaz`:

```nginx
server {
    listen 443 ssl http2;
    server_name casadapaz.inovatitech.com.br;

    ssl_certificate     /etc/nginx/ssl/casadapaz/origin.pem;
    ssl_certificate_key /etc/nginx/ssl/casadapaz/origin-key.pem;

    location / {
        proxy_pass http://127.0.0.1:9080;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}

server {
    listen 80;
    server_name casadapaz.inovatitech.com.br;
    return 301 https://$host$request_uri;
}
```

Ativar:

```bash
sudo ln -sf /etc/nginx/sites-available/casadapaz /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

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
