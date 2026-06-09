# Playbook — Chatwoot + N8N

## Serviços (Docker)
- Chatwoot: http://localhost:3001
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

Header: `X-Webhook-Secret: ${N8N_WEBHOOK_SECRET}`

1. **lembrete_atraso** — cron diário → GET `/api/financeiro/atrasados` → Chatwoot send
2. **recibo_pago** — webhook status CONCLUIDO → WhatsApp recibo
3. **novo_agendamento** — disparado automaticamente ao POST `/api/public/agendamentos`
4. **agendamento_confirmado/cancelado** — disparado pela recepção
5. **ingresso_oficina** — inscrição paga → e-mail + WhatsApp

Trigger manual (DIRETORIA): `POST /api/webhooks/n8n/trigger`

## Configuração produção
- Runbook: **`docs/memory/runbooks/deploy-messaging-prod.md`**
- WhatsApp Business API conectada ao Chatwoot (token Meta — gate humano)
- `N8N_WEBHOOK_SECRET` no backend e header `X-Webhook-Secret`
- Widget: `VITE_CHATWOOT_WEBSITE_TOKEN` + `VITE_CHATWOOT_BASE_URL` no build frontend
