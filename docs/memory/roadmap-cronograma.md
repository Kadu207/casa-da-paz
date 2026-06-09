# Cronograma — Casa da Paz

**Atualizado:** 2026-06-09

## Em andamento

| Fase | Escopo | Stack | Status |
|------|--------|-------|--------|
| **003-financeiro-v2 S1** | fluxo-caixa, listagem, batch | Express/Prisma | ✅ Produção |
| **003-financeiro-v2 S2** | conciliação, export, histórico, métricas período | Express/Prisma | 🔄 Backend TDD |
| **003-financeiro-v2 S3** | 4 abas UI financeiro | React/Vite | ⏸ Agendado após S2 |

## Sequência acordada (Opção A)

```
S2 backend (agora)
    ↓ deploy VPS + smoke
S3 frontend Vite (posterior)
    ↓ gates integração/qualidade
016-frontend-nextjs (monorepo /public + /app)
    ↓ ADR-009 + cutover plan
Produção Next.js (sem quebrar API Express)
```

## Quando executar Next.js (016)

**Iniciar somente quando:**

1. Sprint 3 de `003-financeiro-v2` estiver **concluído e em produção** (fluxo, atrasados, conciliação na UI Vite).
2. Checklist de gates S3.6 passar (integração API ↔ UI ↔ RBAC).
3. Usuário aprovar epic 016 explicitamente.
4. ADR-009 (plano de migração/cutover) ratificado.

**Não executar agora:** SEO/SSR do portal `/public/*` permanece com SPA Vite até essa fase.

## Pipeline (inalterado)

| Ambiente | Fluxo |
|----------|--------|
| CI | `backend`: lint + test · `frontend`: lint + build |
| VPS | `git pull` → backup → `deploy.sh` · frontend via `sync-frontend-vps.ps1` ou build Docker |
| Next.js (futuro) | Novo job CI + runbook deploy — só após 016 |

## Referências

- Spec financeiro v2: `specs/003-financeiro-v2/spec.md`
- Spec Next.js (futuro): `specs/016-frontend-nextjs/spec.md`
- ADR adiamento: `docs/memory/decisions/008-defer-nextjs-pos-financeiro-v2.md`
