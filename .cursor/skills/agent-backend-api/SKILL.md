---
name: agent-backend-api
description: Express Prisma REST API, Zod, transações, webhooks Asaas/N8N/PIX Casa da Paz.
---

# Agente Backend e API (A2)

## Escopo
- `backend/src/`
- `backend/src/services/asaas/`
- `docs/contracts/openapi.yaml`

## Checklist
- [x] Zod schema para body/params (rotas críticas) — 2026-08-08
- [x] RBAC policy aplicada (`authorize`) — 2026-08-08
- [x] OpenAPI / contratos em `docs/contracts/` — 2026-08-08
- [x] Transações atômicas em lote (import Excel, OFX) — 2026-08-08
- [x] Webhooks com secret validation — 2026-08-08
- [x] Asaas sandbox por padrão (`ASAAS_ENV=sandbox`) — 2026-08-08
- [x] Tesouraria 022–025 sem depender de Asaas — 2026-08-08
- [x] Webhook Asaas idempotente (`AsaasWebhookEvent`) — 2026-08-08
- [x] Conciliação ledger ↔ pedido ↔ inscrição atômica — 2026-08-08
