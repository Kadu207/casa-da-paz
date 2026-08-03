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
- [ ] Zod schema para body/params
- [ ] RBAC policy aplicada
- [ ] OpenAPI atualizado
- [ ] Transações atômicas em lote
- [ ] Webhooks com secret validation
- [ ] Asaas sandbox por padrão (`ASAAS_ENV=sandbox`)
- [ ] Webhook Asaas idempotente (`AsaasWebhookEvent`)
- [ ] Conciliação ledger ↔ pedido ↔ inscrição atômica
