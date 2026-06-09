# ADR-008 — Adiar migração Next.js até após financeiro v2 (UI)

**Status:** Aceito | **Data:** 2026-06-09

## Contexto

O frontend atual é **React 19 + Vite + TypeScript + React Router** (SPA servida pelo nginx). Foi avaliada migração para **Next.js** (monorepo `/public` + `/app`) por SEO/performance do portal.

## Decisão

1. **Manter Vite** para todo o ERP e portal até concluir **003-financeiro-v2 Sprint 3** (UI).
2. **Não migrar** para Next.js no curto prazo; SEO avançado do portal público fica **fora de escopo imediato**.
3. Abrir **`specs/016-frontend-nextjs`** como epic futuro; execução só após S3 validado em produção.
4. Antes de codar a migração Next.js, registrar **ADR-009** (plano técnico de cutover) — este ADR-008 apenas registra o adiamento.

## Consequências

- Pipeline de deploy permanece: `npm run build` → `frontend/dist` → nginx (sem Node no host).
- Sprint 2 (backend conciliação/export) e Sprint 3 (telas Vite) seguem sem reescrita de stack.
- Ganho de SEO/SSR do portal fica programado para **fase pós-financeiro v2**.

## Gatilho para iniciar 016

| Pré-requisito | Verificação |
|---------------|-------------|
| S2 backend financeiro v2 | Deploy + testes CI |
| S3 UI financeiro v2 | 4 abas em Vite em produção |
| Gates | validador-integracao + validador-qualidade |
| Aprovação usuário | Confirmação explícita antes de epic Next.js |

## Cronograma (referência)

Ver `docs/memory/roadmap-cronograma.md`.
