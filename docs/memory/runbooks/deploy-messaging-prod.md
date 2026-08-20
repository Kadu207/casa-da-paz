# Runbook â€” Chatwoot + N8N em produÃ§Ã£o (Epic 012)

**DomÃ­nio portal:** https://casadapaz.inovatitech.com.br  
**Chatwoot sugerido:** https://chat.casadapaz.inovatitech.com.br

## PrÃ©-requisitos

- Stack base rodando (`compose-prod.sh up -d`)
- Conta **Meta Business** com WhatsApp Business API (token permanente â€” **gate humano**)
- VariÃ¡veis em `infra/.env.production` (ver `.env.production.example`)

## 1. PC Windows â€” build e sync frontend

**NÃ£o use `...` no caminho.** Da pasta raiz do repo:

```powershell
Set-Location "C:\Projetos DEV\Casa da Paz"
Copy-Item frontend\.env.production.example frontend\.env.production
# Edite frontend\.env.production com VITE_CHATWOOT_* apÃ³s criar inbox no Chatwoot
.\scripts\deploy-frontend-vps.ps1 -PasswordOnly -RestartFrontend
```

Ou em dois passos:

```powershell
.\scripts\build-frontend-prod.ps1
.\scripts\sync-frontend-vps.ps1 -PasswordOnly -RestartFrontend
```

## 2. VPS â€” variÃ¡veis em `.env.production`

**VocÃª nÃ£o â€œbuscaâ€ esses valores â€” vocÃª cria/genera:**

| VariÃ¡vel | O que Ã© | Como obter |
|----------|---------|------------|
| `N8N_USER` | Login da UI N8N | Escolha livre (ex.: `admin`) |
| `N8N_PASSWORD` | Senha da UI N8N | Gere: `openssl rand -hex 16` |
| `N8N_WEBHOOK_SECRET` | Header backendâ†’N8N | Gere: `openssl rand -hex 32` |
| `CHATWOOT_SECRET` | Rails secret (min 32 chars) | Gere: `openssl rand -hex 32` |
| `CHATWOOT_PUBLIC_URL` | URL pÃºblica do Chatwoot | `https://chat.casadapaz.inovatitech.com.br` |
| `CHATWOOT_BIND` | Interface Docker | **`0.0.0.0`** no inovati-server (cloudflared Swarm) |
| `CHATWOOT_PORT` | Porta no host | `3001` |

Na VPS:

```bash
cd ~/casadapaz/infra
nano .env.production
# Cole no final (substitua os valores gerados):
# N8N_USER=admin
# N8N_PASSWORD=<openssl rand -hex 16>
# N8N_WEBHOOK_SECRET=<openssl rand -hex 32>
# CHATWOOT_SECRET=<openssl rand -hex 32>
# CHATWOOT_PUBLIC_URL=https://chat.casadapaz.inovatitech.com.br
# CHATWOOT_BIND=0.0.0.0
# CHATWOOT_PORT=3001
```

Gerar trÃªs segredos de uma vez:

```bash
echo "N8N_PASSWORD=$(openssl rand -hex 16)"
echo "N8N_WEBHOOK_SECRET=$(openssl rand -hex 32)"
echo "CHATWOOT_SECRET=$(openssl rand -hex 32)"
```

## 3. VPS â€” git pull (depois do push) + subir mensageria

O `git pull` **antes** do push no PC mostrou â€œAlready up to dateâ€. Rode de novo:

```bash
cd ~/casadapaz
git pull origin main
git log -1 --oneline
# Deve mostrar: 3566422 feat(messaging): Epic 012 ...
ls infra/scripts/compose-prod-messaging.sh
```

```bash
cd ~/casadapaz/infra
chmod +x scripts/*.sh
./scripts/compose-prod-messaging.sh up -d
./scripts/init-chatwoot-prod.sh          # sÃ³ na 1Âª vez
./scripts/import-n8n-workflows.sh
./scripts/compose-prod-messaging.sh restart backend
```

Verificar Chatwoot no host:

```bash
curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3001
# Esperado: 200 ou 302
docker ps --filter name=chatwoot
```

## 4. Cloudflare â€” expor Chatwoot (inovati-server)

No **inovati-server**, cloudflared roda em Docker Swarm. O site principal usa **`http://128.140.77.31:9080`** â€” use o **mesmo padrao** para Chatwoot: **`http://128.140.77.31:3001`**.

### IMPORTANTE â€” hostname e certificado SSL

O Universal SSL gratuito da Cloudflare cobre `*.inovatitech.com.br`, mas **NAO** cobre
`chat.casadapaz.inovatitech.com.br` (3o nivel). Sintoma: `TLS handshake failure` no curl HTTPS.

**Use hostname de 2o nivel** (recomendado):

| Campo | Valor |
|-------|--------|
| Subdomain | `casadapaz-chat` |
| Domain | `inovatitech.com.br` |
| URL final | `https://casadapaz-chat.inovatitech.com.br` |

Remova ou ignore `chat.casadapaz.inovatitech.com.br` se criou antes.

Atualize na VPS `infra/.env.production`:

```bash
CHATWOOT_PUBLIC_URL=https://casadapaz-chat.inovatitech.com.br
```

**Antes** de configurar Cloudflare: Chatwoot deve estar rodando (`docker ps` mostra container chatwoot).

1. [Cloudflare Zero Trust](https://one.dash.cloudflare.com/) â†’ **Networks** â†’ **Tunnels** â†’ tÃºnel **Connected** (mesmo do `casadapaz.inovatitech.com.br`)
2. **Public Hostname** â†’ **Add a public hostname**

| Campo | Valor |
|-------|--------|
| Subdomain | `casadapaz-chat` |
| Domain | `inovatitech.com.br` |
| Type | HTTP |
| URL | `http://128.140.77.31:3001` |

3. Aguarde ~2 min, teste:

```bash
curl -s -o /dev/null -w "%{http_code}\n" https://casadapaz-chat.inovatitech.com.br
```

Esperado: **302**. Se `TLS handshake failure`, confira SSL/TLS â†’ Edge Certificates no painel Cloudflare.

### Alternativa (nao recomendada): certificado avancado

SSL/TLS â†’ Edge Certificates â†’ Order Advanced Certificate para `*.casadapaz.inovatitech.com.br`.

## 5. Cloudflare â€” VPS dedicada (alternativa)

Se cloudflared alcanÃ§a localhost:

| Hostname | Service |
|----------|---------|
| `chat.casadapaz.inovatitech.com.br` | `http://127.0.0.1:3001` |

## 6. Chatwoot â€” primeira configuraÃ§Ã£o

1. Acesse `https://chat.casadapaz.inovatitech.com.br` (tÃºnel ativo)
2. Crie conta admin (recepÃ§Ã£o/diretoria)
3. **Settings â†’ Inboxes â†’ Add Inbox â†’ Website**
   - Copie **Website Token** â†’ `frontend/.env.production` â†’ `VITE_CHATWOOT_WEBSITE_TOKEN`
   - `VITE_CHATWOOT_BASE_URL` = URL pÃºblica do Chatwoot
4. **Settings â†’ Inboxes â†’ Add Inbox â†’ WhatsApp**
   - Conecte Meta Business (Phone Number ID, WABA ID, **Permanent Access Token**)
   - Token Meta **nÃ£o** vai no repositÃ³rio â€” sÃ³ no painel Chatwoot
5. **Profile â†’ Access Token** â†’ `CHATWOOT_API_TOKEN` no `infra/.env.production` (N8N enviar mensagens depois)

Rebuild frontend no PC apÃ³s definir `VITE_CHATWOOT_*`.

## 7. N8N â€” workflows

Importados automaticamente por `import-n8n-workflows.sh`. Webhooks (rede Docker):

| Workflow backend | Path N8N |
|------------------|----------|
| `novo_agendamento` | `/webhook/casadapaz-agendamento` |
| `agendamento_confirmado` | `/webhook/casadapaz-agendamento-confirmado` |
| `agendamento_cancelado` | `/webhook/casadapaz-agendamento-cancelado` |
| `lembrete_atraso` | `/webhook/casadapaz-lembrete-atraso` |
| `recibo_pago` | `/webhook/casadapaz-recibo-pago` |
| `ingresso_oficina` | `/webhook/casadapaz-ingresso-oficina` |

Header: `X-Webhook-Secret: ${N8N_WEBHOOK_SECRET}`

UI N8N (opcional, tÃºnel SSH): `ssh -p 65025 -L 5678:127.0.0.1:5678 gestaoti@128.140.77.31` â€” expor porta se necessÃ¡rio.

## 8. Smoke test

```bash
# Backend dispara N8N (login DIRETORIA)
curl -s -X POST https://casadapaz.inovatitech.com.br/api/webhooks/n8n/trigger \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"workflow":"novo_agendamento","payload":{"teste":true}}'
```

Portal: `/public/contato` â€” bubble Chatwoot visÃ­vel se token configurado.

## Rollback

```bash
./scripts/compose-prod-messaging.sh stop n8n chatwoot chatwoot-sidekiq redis
./scripts/compose-prod.sh restart backend
```

## Troubleshooting

### `extension "vector" is not available`

Chatwoot latest exige **pgvector**. O compose prod usa `pgvector/pgvector:pg16`.

```bash
cd ~/casadapaz && git pull origin main
cd infra
./scripts/compose-prod-messaging.sh pull db
./scripts/compose-prod-messaging.sh up -d db
# aguarde ~10s
./scripts/init-chatwoot-prod.sh
```

### `curl http://127.0.0.1:3001` â†’ HTTP 000

Chatwoot nao subiu (schema falhou ou container reiniciando). Confira:

```bash
docker logs infra-chatwoot-1 --tail 40
docker ps --filter name=chatwoot
```

`CHATWOOT_BIND` deve ser **`0.0.0.0`** no `.env.production` (inovati-server). Depois:

```bash
./scripts/compose-prod-messaging.sh up -d chatwoot chatwoot-sidekiq
curl -s -o /dev/null -w "HTTP %{http_code}\n" http://127.0.0.1:3001
curl -s -o /dev/null -w "HTTP %{http_code}\n" http://172.17.0.1:3001
```

Ambos devem retornar **200** ou **302** antes de configurar Cloudflare.

### Cloudflare `HTTP 000` em `https://chat...`

1. Chatwoot respondendo localmente (passo acima)
2. Hostname `chat.casadapaz.inovatitech.com.br` criado no **mesmo tÃºnel** do site
3. Service URL: `http://172.17.0.1:3001` (nao `127.0.0.1` no inovati-server)

ADR: `docs/memory/decisions/006-whatsapp-chatwoot-n8n.md`
