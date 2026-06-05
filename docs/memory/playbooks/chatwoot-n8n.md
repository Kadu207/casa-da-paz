# Playbook — Chatwoot + N8N

## Serviços (Docker)
- Chatwoot: http://localhost:3001
- N8N: http://localhost:5678

## Workflows N8N MVP
1. **lembrete_atraso** — cron diário → GET `/api/financeiro/atrasados` → Chatwoot send
2. **recibo_pago** — webhook status CONCLUIDO → WhatsApp recibo
3. **novo_agendamento** — POST agendamento → notifica recepção
4. **ingresso_oficina** — inscrição paga → e-mail + WhatsApp

## Configuração produção
- WhatsApp Business API conectada ao Chatwoot
- `N8N_WEBHOOK_SECRET` no backend e N8N credentials
