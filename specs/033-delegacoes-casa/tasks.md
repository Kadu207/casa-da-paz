# Tasks — 033 Delegações

- [x] Spec + ADR-011 + rbac-matrix
- [x] Prisma migration + seed funções
- [x] API `/api/delegacoes` + testes RBAC
- [x] N8N stub + sync-alertas
- [x] FE menu + DelegacoesPage + i18n
- [x] Memória / agents.md
- [x] Deploy VPS (migrate + seed + rebuild) — 2026-09-02
- [x] Import workflow N8N em produção
- [ ] Credencial SMTP N8N + inbox WhatsApp Meta (gate humano)

## Validação V1 (integração) — 2026-09-02

| Check | OK | Ref |
|-------|----|-----|
| Rotas Express ↔ FE | ✅ | `delegacoes.ts` ↔ `DelegacoesPage` |
| Prisma ↔ migration | ✅ | `20260902120000_delegacoes_casa_033` |
| RBAC matrix ↔ policies | ✅ | `delegacoes` em `rbac.ts` + matrix |
| N8N webhook | ✅ | `tarefa_delegacao` ativo na VPS |

## Validação V2 (qualidade) — 2026-09-02

| Check | OK |
|-------|----|
| Constitution (RBAC backend, deploy gate) | ✅ |
| Vitest + FE tsc | ✅ |
| Deploy + health | ✅ |
| Docs refresh | ✅ |
