# Playbook — Chatwoot + N8N

## Serviços (Docker)
- Chatwoot: http://localhost:3001 (prod público: `https://casadapaz-chat.inovatitech.com.br`)
- N8N: http://localhost:5678

## Workflows N8N MVP

Webhooks de entrada (backend → N8N):

| Workflow | Path N8N |
|----------|----------|
| `novo_agendamento` | `POST /webhook/casadapaz-agendamento` |
| `agendamento_confirmado` | `POST /webhook/casadapaz-agendamento-confirmado` |
| `agendamento_cancelado` | `POST /webhook/casadapaz-agendamento-cancelado` |
| `lembrete_atraso` | `POST /webhook/casadapaz-lembrete-atraso` |
| `recibo_pago` | `POST /webhook/casadapaz-recibo-pago` |
| `ingresso_oficina` | `POST /webhook/casadapaz-ingresso-oficina` |
| `tarefa_delegacao` | `POST /webhook/casadapaz-tarefa-delegacao` |

Header: `X-Webhook-Secret: ${N8N_WEBHOOK_SECRET}`

1. **lembrete_atraso** — cron diário → GET `/api/financeiro/atrasados` → Chatwoot send
2. **recibo_pago** — webhook status CONCLUIDO → WhatsApp recibo
3. **novo_agendamento** — disparado automaticamente ao POST `/api/public/agendamentos`
4. **agendamento_confirmado/cancelado** — disparado pela recepção
5. **ingresso_oficina** — reserva pública ou pagamento confirmado → e-mail SMTP + Chatwoot (WhatsApp/Telegram)
6. **tarefa_delegacao** — spec 033 → e-mail + Chatwoot

Trigger manual (DIRETORIA): `POST /api/webhooks/n8n/trigger`

## Configuração produção
- Runbook: **`docs/memory/runbooks/deploy-messaging-prod.md`**
- WhatsApp Business API conectada ao Chatwoot (token Meta — gate humano)
- Telegram Bot via inbox Chatwoot (token BotFather — gate humano)
- Credencial N8N **SMTP Casa da Paz** (host/user/pass — gate humano; nunca no git)
- `N8N_WEBHOOK_SECRET` no backend e header `X-Webhook-Secret`
- Widget: `VITE_CHATWOOT_WEBSITE_TOKEN` + `VITE_CHATWOOT_BASE_URL` no build frontend
- Link `t.me` em `/public/contato` continua como atalho (config ERP Pontos)

## Gates humanos (credenciais fora do repositório)

### SMTP (N8N)
1. Abrir UI N8N (túnel SSH se necessário)
2. Credentials → **SMTP** → nome exato `SMTP Casa da Paz`
3. Host, porta, usuário, senha, SSL/TLS conforme o provedor
4. Em `infra/.env.production`: `SMTP_FROM=noreply@casadapaz.inovatitech.com.br`
5. Testar workflow `ingresso_oficina` ou `tarefa_delegacao` com e-mail real

### WhatsApp Meta (Chatwoot T8)
1. Conta Meta Business + WhatsApp Business API
2. Phone Number ID, WABA ID, **Permanent Access Token**
3. Chatwoot → Settings → Inboxes → **WhatsApp** → colar token só no painel
4. (Opcional) `CHATWOOT_API_TOKEN` + `CHATWOOT_INBOX_ID` no `.env.production` para N8N enviar

### Telegram (Chatwoot)
1. Criar bot no **BotFather** → guardar token
2. Chatwoot → Settings → Inboxes → **Telegram** → colar token
3. Webhook do bot deve apontar para o Chatwoot (o painel configura)
4. Recebimento cai na mesma fila da recepção; envio via API Chatwoot (mesmo nó N8N)
5. Link público `https://t.me/...` continua editável em `/app/pontos`

## Diagnóstico Chatwoot 502 / HTTP 000

Observado em 2026-10-27: `https://casadapaz-chat.inovatitech.com.br` sem resposta (curl `000`) enquanto o app principal respondia 200.

**Só após confirmação SSH do usuário** (sem `deploy.sh` / sem restart até autorizar):

```bash
ssh -p 65025 gestaoti@128.140.77.31
docker ps --filter name=chatwoot
docker logs infra-chatwoot-1 --tail 80
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:3001
curl -s -o /dev/null -w "%{http_code}\n" https://casadapaz-chat.inovatitech.com.br
```

Checklist:
1. Container `chatwoot` e `chatwoot-sidekiq` UP
2. Porta host `3001` escutando (`CHATWOOT_BIND=0.0.0.0`)
3. Túnel Cloudflare hostname `casadapaz-chat` → `http://127.0.0.1:3001` (ou IP Docker conforme runbook)
4. Não confundir com `chat.inovatitech.com.br` (Inovati)

Se local 200/302 e público 502/000 → problema no túnel/DNS Cloudflare.  
Se local 000 → container/DB; ver `init-chatwoot-prod.sh` e extensão `vector`.
