# Tasks — 033 Delegações

- [x] Spec + ADR-011 + rbac-matrix
- [x] Prisma migration + seed funções
- [x] API `/api/delegacoes` + testes RBAC
- [x] N8N stub + sync-alertas
- [x] FE menu + DelegacoesPage + i18n
- [x] Memória / agents.md
- [ ] Deploy VPS (migrate + seed + rebuild) — **somente com confirmação**

## Validação V1 (integração) — 2026-09-02

| Check | OK | Ref |
|-------|----|-----|
| Rotas Express ↔ FE | ✅ | `delegacoes.ts` ↔ `DelegacoesPage` `/api/delegacoes/*` |
| Prisma ↔ migration | ✅ | `20260902120000_delegacoes_casa_033` |
| RBAC matrix ↔ policies | ✅ | `delegacoes` em `rbac.ts` + `rbac-matrix.md` |
| N8N webhook | ✅ | `tarefa_delegacao` → `casadapaz-tarefa-delegacao` |

## Validação V2 (qualidade) — 2026-09-02

| Check | OK |
|-------|----|
| Constitution (RBAC backend, deploy gate) | ✅ |
| Vitest `delegacoes.test` + rbac-snapshot | ✅ 9 passed |
| FE `tsc --noEmit` | ✅ |
| Sem secrets | ✅ |
| Deploy sem confirmação | ❌ (bloqueado de propósito) |
