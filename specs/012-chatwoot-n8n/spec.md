# Spec 012 — Chatwoot + N8N produção

**Status:** Em implementação | **ADR:** 006

## Objetivo

Mensageria em produção: widget Chatwoot no portal, N8N orquestrando webhooks do backend, WhatsApp via Meta conectado ao Chatwoot.

## Escopo V1

- [x] Compose produção: `docker-compose.prod.messaging.yml`
- [x] Scripts VPS: init Chatwoot, import workflows, compose wrapper
- [x] Widget SDK no portal (`ChatwootWidget`)
- [x] 6 workflows N8N (stubs webhook)
- [x] Runbook `docs/memory/runbooks/deploy-messaging-prod.md`
- [ ] Meta WhatsApp conectado (gate humano) — ver **T8** em `tasks.md`
- [x] `VITE_CHATWOOT_*` no build de produção (bubble no ar 2026-06-10)
- [ ] Smoke E2E agendamento → N8N → Chatwoot — ver **T10** em `tasks.md`

## Fora de escopo V1

- Nós N8N HTTP → Chatwoot API (fase 2)
- Cron lembrete_atraso automático
- N8N exposto publicamente

## Contratos

- Backend → N8N: `backend/src/lib/n8n.ts`
- Trigger manual: `POST /api/webhooks/n8n/trigger` (DIRETORIA)
- Env: `infra/.env.production.example`, `frontend/.env.production.example`

## Aceite

1. Stack messaging sobe na VPS sem quebrar site
2. Widget aparece em `/public/*` com token configurado
3. Webhook `novo_agendamento` retorna 200 no N8N
4. Documentação Meta token completa no runbook
