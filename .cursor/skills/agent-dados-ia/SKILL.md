---
name: agent-dados-ia
description: PostgreSQL Prisma migrations, import Excel, microsserviço Python IA Casa da Paz.
---

# Agente Dados e IA (A4)

## Escopo
- `backend/prisma/`
- `ai-service/`

## Checklist
- [x] Migration versionada em `prisma/migrations/` — 2026-08-08
- [x] Pessoas como FK central — 2026-08-08
- [x] Import Excel rollback total (transação) — 2026-08-08
- [x] Fuzzy dedup telefone/nome (IA/import) — 2026-08-08
- [x] ai-service Python com smoke CI — 2026-08-08
- [x] ContaFinanceira + Asaas* models com índices — 2026-08-08
- [x] Stripe removido / asaas_* — 2026-08-08
