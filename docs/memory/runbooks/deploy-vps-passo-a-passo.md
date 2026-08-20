# Deploy VPS Hetzner â€” Passo a passo

> **DomÃ­nio:** `https://casadapaz.inovatitech.com.br`  
> **RepositÃ³rio:** `kadu207/casa-da-paz` (main)  
> Execute na VPS via SSH (Ubuntu/Debian recomendado).

**Servidor compartilhado** (Docker na 80, Excellence Dental no domÃ­nio):  
â†’ [deploy-cloudflare-tunnel.md](./deploy-cloudflare-tunnel.md) (recomendado) ou [deploy-servidor-compartilhado.md](./deploy-servidor-compartilhado.md)

---

## 1. PrÃ©-requisitos na VPS

```bash
# Docker + Compose
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
# Re-login SSH

# Git
sudo apt update && sudo apt install -y git
```

---

## 2. Clonar / atualizar projeto

```bash
cd ~
git clone https://github.com/kadu207/casa-da-paz.git casadapaz
# ou, se jÃ¡ existe:
cd ~/casadapaz && git pull origin main
```

---

## 3. Secrets de produÃ§Ã£o

**OpÃ§Ã£o A â€” editar na VPS:**

```bash
cd ~/casadapaz/infra
cp .env.production.example .env.production
nano .env.production
```

**OpÃ§Ã£o B â€” editar no PC e enviar (recomendado):**

No Windows, na pasta do projeto:

```powershell
# Edite infra\.env.production localmente, depois:
.\scripts\sync-env-vps.ps1
```

Ou manualmente:

```powershell
scp -P 65025 "infra\.env.production" gestaoti@128.140.77.31:~/casadapaz/infra/.env.production
```

VariÃ¡veis obrigatÃ³rias para servidor compartilhado (porta 80 ocupada):

```env
DB_PASSWORD=...
JWT_SECRET=...
NGINX_CONF=prod-internal.conf
HOST_BIND=127.0.0.1
HOST_HTTP_PORT=9080
```

**Nunca** commitar `.env.production`.

---

## 4. Certificado SSL (Cloudflare Origin)

1. Cloudflare â†’ SSL/TLS â†’ Origin Server â†’ Create Certificate  
2. Salvar na VPS:

```bash
mkdir -p ~/casadapaz/infra/nginx/ssl
nano ~/casadapaz/infra/nginx/ssl/origin.pem      # colar certificado
nano ~/casadapaz/infra/nginx/ssl/origin-key.pem  # colar chave privada
chmod 600 ~/casadapaz/infra/nginx/ssl/*
```

3. DNS (Cloudflare): registro **A** `casadapaz` â†’ IP da VPS (proxy laranja)  
4. SSL/TLS mode: **Full (Strict)**

Ver tambÃ©m: `infra/cloudflare-dns.md`

---

## 5. Build do frontend (obrigatÃ³rio â€” evita nginx 500)

O `frontend/dist` **nÃ£o vai no Git**. Sem build, `/login` retorna **500 Internal Server Error**.

**Na VPS:**

```bash
cd ~/casadapaz/frontend
npm ci
npm run build
ls -la dist/index.html
grep -o "Casa da Paz" dist/index.html | head -1
cd ../infra
./scripts/verify-frontend-dist.sh
./scripts/compose-prod.sh restart frontend
curl -sI http://127.0.0.1:9080/login | head -3
```

**No Windows** (apÃ³s `npm run build` local):

```powershell
.\scripts\sync-frontend-vps.ps1
```

---

## 6. Deploy Docker

```bash
cd ~/casadapaz/infra
chmod +x scripts/*.sh
CASADAPAZ_DEPLOY_CONFIRMED=yes ./scripts/deploy.sh
```

O script usa `./scripts/compose-prod.sh`, que carrega `.env.production` automaticamente (sem avisos de `DB_PASSWORD` vazio).

Porta padrÃ£o em servidor compartilhado: **9080** em `127.0.0.1` (nÃ£o conflita com a 80).

O backend roda `prisma migrate deploy` automaticamente no container.

---

## 7. Seed inicial (apenas 1Âª vez)

```bash
cd ~/casadapaz/infra
./scripts/compose-prod.sh exec backend npx prisma db seed
```

Credenciais padrÃ£o: `admin` / `admin123` â€” **troque em seguida** em `/app/minha-senha`.

---

## 8. Smoke tests

```bash
# Local (porta 9080 â€” Casa da Paz)
curl -s http://127.0.0.1:9080/health

# PÃºblico (apÃ³s vhost nginx no host â€” ver deploy-servidor-compartilhado.md)
curl -s https://casadapaz.inovatitech.com.br/health
curl -sI https://casadapaz.inovatitech.com.br/public
curl -s https://casadapaz.inovatitech.com.br/api/public/eventos
```

No browser:
- Portal: `/public`
- Livraria: `/public/livraria`
- Login ERP: `/login`

---

## 9. PÃ³s-deploy

| Item | AÃ§Ã£o |
|------|------|
| Senha admin | Alterar via `/app/minha-senha` |
| Livraria | Cadastrar livros em `/app/livraria` â†’ aba CatÃ¡logo |
| Novidades/dicas | `/app/livraria` â†’ aba Novidades & dicas |
| Stripe | Fase 2 â€” apÃ³s VPS estÃ¡vel |
| Backup DB | `./scripts/compose-prod.sh exec db pg_dump -U admin_casadapaz casadapaz_db > backup.sql` |

---

## Rollback

```bash
cd ~/casadapaz/infra
./scripts/compose-prod.sh down
# Restaurar pgdata de backup se necessÃ¡rio
```

---

## Checklist rÃ¡pido

- [ ] VPS com Docker
- [ ] `.env.production` preenchido
- [ ] SSL origin em `infra/nginx/ssl/`
- [ ] DNS apontando
- [ ] `frontend/dist` buildado
- [ ] `deploy.sh` executado
- [ ] Seed + troca de senha
- [ ] Smoke tests OK
