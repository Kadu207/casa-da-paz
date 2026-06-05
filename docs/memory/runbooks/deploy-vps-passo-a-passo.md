# Deploy VPS Hetzner — Passo a passo

> **Domínio:** `https://casadapaz.inovatitech.com.br`  
> **Repositório:** `kadu207/casa-da-paz` (main)  
> Execute na VPS via SSH (Ubuntu/Debian recomendado).

---

## 1. Pré-requisitos na VPS

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
# ou, se já existe:
cd ~/casadapaz && git pull origin main
```

---

## 3. Secrets de produção

```bash
cd ~/casadapaz/infra
cp .env.production.example .env.production
nano .env.production   # preencher DB_PASSWORD e JWT_SECRET (openssl rand -hex 32)
```

**Nunca** commitar `.env.production`.

---

## 4. Certificado SSL (Cloudflare Origin)

1. Cloudflare → SSL/TLS → Origin Server → Create Certificate  
2. Salvar na VPS:

```bash
mkdir -p ~/casadapaz/infra/nginx/ssl
nano ~/casadapaz/infra/nginx/ssl/origin.pem      # colar certificado
nano ~/casadapaz/infra/nginx/ssl/origin-key.pem  # colar chave privada
chmod 600 ~/casadapaz/infra/nginx/ssl/*
```

3. DNS (Cloudflare): registro **A** `casadapaz` → IP da VPS (proxy laranja)  
4. SSL/TLS mode: **Full (Strict)**

Ver também: `infra/cloudflare-dns.md`

---

## 5. Build do frontend (na VPS ou local + rsync)

```bash
cd ~/casadapaz/frontend
npm ci
npm run build
# gera frontend/dist/
```

No Windows (antes de enviar): `.\scripts\prepare-deploy.ps1`

---

## 6. Deploy Docker

```bash
cd ~/casadapaz/infra
export $(grep -v '^#' .env.production | xargs)
CASADAPAZ_DEPLOY_CONFIRMED=yes ./scripts/deploy.sh
```

O backend roda `prisma migrate deploy` automaticamente no container.

---

## 7. Seed inicial (apenas 1ª vez)

```bash
docker compose -f docker-compose.prod.yml exec backend npx prisma db seed
```

Credenciais padrão: `admin` / `admin123` — **troque em seguida** em `/app/minha-senha`.

---

## 8. Smoke tests

```bash
curl -s https://casadapaz.inovatitech.com.br/health
curl -sI https://casadapaz.inovatitech.com.br/public
curl -s https://casadapaz.inovatitech.com.br/api/public/eventos
```

No browser:
- Portal: `/public`
- Livraria: `/public/livraria`
- Login ERP: `/login`

---

## 9. Pós-deploy

| Item | Ação |
|------|------|
| Senha admin | Alterar via `/app/minha-senha` |
| Livraria | Cadastrar livros em `/app/livraria` → aba Catálogo |
| Novidades/dicas | `/app/livraria` → aba Novidades & dicas |
| Stripe | Fase 2 — após VPS estável |
| Backup DB | `docker compose -f docker-compose.prod.yml exec db pg_dump -U admin_casadapaz casadapaz_db > backup.sql` |

---

## Rollback

```bash
cd ~/casadapaz/infra
docker compose -f docker-compose.prod.yml down
# Restaurar pgdata de backup se necessário
```

---

## Checklist rápido

- [ ] VPS com Docker
- [ ] `.env.production` preenchido
- [ ] SSL origin em `infra/nginx/ssl/`
- [ ] DNS apontando
- [ ] `frontend/dist` buildado
- [ ] `deploy.sh` executado
- [ ] Seed + troca de senha
- [ ] Smoke tests OK
