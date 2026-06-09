# Runbook — Chatwoot + N8N em produção (Epic 012)

**Domínio portal:** https://casadapaz.inovatitech.com.br  
**Chatwoot sugerido:** https://chat.casadapaz.inovatitech.com.br (Cloudflare Tunnel → `127.0.0.1:3001`)

## Pré-requisitos

- Stack base rodando (`compose-prod.sh up -d`)
- Conta **Meta Business** com WhatsApp Business API (token permanente — **gate humano**)
- Variáveis em `infra/.env.production` (ver `.env.production.example`)

## 1. PC Windows — build e sync frontend

**Não use `...` no caminho.** Da pasta raiz do repo:

```powershell
Set-Location "C:\Users\Carlos\OneDrive\Área de Trabalho\Projetos DEV\Casa da Paz"
Copy-Item frontend\.env.production.example frontend\.env.production
# Edite frontend\.env.production com VITE_CHATWOOT_* após criar inbox no Chatwoot
.\scripts\deploy-frontend-vps.ps1 -PasswordOnly -RestartFrontend
```

Ou em dois passos:

```powershell
.\scripts\build-frontend-prod.ps1
.\scripts\sync-frontend-vps.ps1 -PasswordOnly -RestartFrontend
```

## 2. VPS — subir mensageria

```bash
cd ~/casadapaz && git pull
cd infra
# Adicione N8N_*, CHATWOOT_* ao .env.production (nunca commitar)
chmod +x scripts/*.sh
./scripts/compose-prod-messaging.sh up -d
./scripts/init-chatwoot-prod.sh          # só na 1ª vez
./scripts/import-n8n-workflows.sh
./scripts/compose-prod-messaging.sh restart backend
```

## 3. Cloudflare — expor Chatwoot

No painel Cloudflare Zero Trust (mesmo túnel do site):

| Hostname | Service |
|----------|---------|
| `chat.casadapaz.inovatitech.com.br` | `http://127.0.0.1:3001` |

## 4. Chatwoot — primeira configuração

1. Acesse `https://chat.casadapaz.inovatitech.com.br` (túnel ativo)
2. Crie conta admin (recepção/diretoria)
3. **Settings → Inboxes → Add Inbox → Website**
   - Copie **Website Token** → `frontend/.env.production` → `VITE_CHATWOOT_WEBSITE_TOKEN`
   - `VITE_CHATWOOT_BASE_URL` = URL pública do Chatwoot
4. **Settings → Inboxes → Add Inbox → WhatsApp**
   - Conecte Meta Business (Phone Number ID, WABA ID, **Permanent Access Token**)
   - Token Meta **não** vai no repositório — só no painel Chatwoot
5. **Profile → Access Token** → `CHATWOOT_API_TOKEN` no `infra/.env.production` (N8N enviar mensagens depois)

Rebuild frontend no PC após definir `VITE_CHATWOOT_*`.

## 5. N8N — workflows

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

UI N8N (opcional, túnel SSH): `ssh -L 5678:127.0.0.1:5678 gestaoti@128.140.77.31` — expor porta se necessário.

## 6. Smoke test

```bash
# Backend dispara N8N (login DIRETORIA)
curl -s -X POST https://casadapaz.inovatitech.com.br/api/webhooks/n8n/trigger \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"workflow":"novo_agendamento","payload":{"teste":true}}'
```

Portal: `/public/contato` — bubble Chatwoot visível se token configurado.

## Rollback

```bash
./scripts/compose-prod-messaging.sh stop n8n chatwoot chatwoot-sidekiq redis
./scripts/compose-prod.sh restart backend
```

ADR: `docs/memory/decisions/006-whatsapp-chatwoot-n8n.md`
