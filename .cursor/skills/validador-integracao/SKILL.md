---
name: validador-integracao
description: Valida coerência API frontend DB RBAC IA entre módulos Casa da Paz.
---

# Validador Integração (V1)

## Checklist
- [ ] OpenAPI ↔ handlers implementados
- [ ] Frontend chama endpoints corretos
- [ ] Prisma schema ↔ migrations
- [ ] RBAC matrix ↔ policies (incl. MARKETING / cobrancas / contas / transparencia)
- [ ] N8N webhooks ↔ backend stubs
- [ ] Asaas webhook ↔ ledger / pedidos / inscricoes

## Formato saída
Tabela sim/não com referência de arquivo:linha
