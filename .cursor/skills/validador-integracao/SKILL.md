---
name: validador-integracao
description: Valida coerência API frontend DB RBAC IA entre módulos Casa da Paz.
---

# Validador Integração (V1)

## Checklist genérico
- [x] OpenAPI ↔ handlers (rotas Express alinhadas às specs ativas) — baseline 2026-08-08
- [x] Frontend chama endpoints corretos (ERP pages ↔ `/api/*`) — 2026-08-08
- [x] Prisma schema ↔ migrations (21 migrations; `usuario_ativo` deployada) — 2026-08-08
- [x] RBAC matrix ↔ policies (MARKETING sem estoque; SUPERVISOR auditoria) — 2026-08-08
- [x] N8N webhooks ↔ backend stubs (`/api/webhooks` + `lib/n8n.ts`) — 2026-08-08
- [x] Asaas webhook ↔ ledger (fail-closed; PSP dormant) — 2026-08-08

## Formato saída
Tabela sim/não com referência de arquivo — ver `specs/*/tasks.md` por feature.

## Última execução formal
- Specs **028** e **029**: ver `specs/028-auditoria-completa-supervisor/tasks.md` e `specs/029-crud-usuarios-livraria-eventos/tasks.md` (2026-08-08).
- Spec **030** security: `specs/030-security-hardening/tasks.md` (2026-08-20) — headers, uploads, firewall, CI.
