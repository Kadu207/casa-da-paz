# ADR-006: WhatsApp via Chatwoot + N8N

**Status:** Aceito | **Data:** 2026-06-05

## Contexto
PDF slide 8 exige WhatsApp para recibos e lembretes. API WhatsApp direta é complexa.

## Decisão
Arquitetura de mensageria MVP:

```
Backend ──webhook──► N8N ──API──► Chatwoot ──► WhatsApp Business
Portal ──widget──► Chatwoot (atendimento humano recepção)
Telegram ──bot──► Chatwoot (mesma inbox da recepção)
```

### Chatwoot (self-hosted no Docker)
- Inbox WhatsApp Business API
- Inbox Telegram (bot BotFather — envio e recebimento na mesma fila)
- Widget embed no portal `/public/contato`
- Agentes: recepção e diretoria
- Link `t.me` no portal é atalho; não substitui a inbox

### N8N (self-hosted no Docker)
- Workflow: lembrete atraso → Chatwoot send message
- Workflow: recibo pago → Chatwoot send message
- Workflow: novo agendamento → notifica recepção
- Workflow: ingresso oficina → e-mail SMTP + Chatwoot (WhatsApp/Telegram)
- Workflow: tarefa delegação → e-mail SMTP + Chatwoot
- Credenciais SMTP/Meta/Telegram **fora** do repositório (gates humanos)

### Backend stubs
- `POST /api/webhooks/n8n/trigger` — autenticado por `N8N_WEBHOOK_SECRET`
- `POST /api/webhooks/pix` — stub conciliação PIX

## Consequências
- Novos serviços em `docker-compose.yml`: `chatwoot`, `n8n`, `redis`
- Variáveis: `CHATWOOT_URL`, `N8N_URL`, `N8N_WEBHOOK_SECRET`
- Sprint 3 no cronograma
