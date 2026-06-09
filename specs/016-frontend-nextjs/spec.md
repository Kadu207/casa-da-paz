# Feature 016 — Frontend Next.js (monorepo /public + /app)

**Status:** Proposta — **NÃO INICIAR** até conclusão de `003-financeiro-v2` Sprint 3  
**Data:** 2026-06-09  
**ADR:** `008-defer-nextjs-pos-financeiro-v2.md` (adiamento) · ADR-009 na abertura da implementação

## Gatilho de execução

Executar este epic **somente após**:

- [ ] S3 UI financeiro v2 em produção (Vite)
- [ ] Gates S3.6 (integração + qualidade)
- [ ] Aprovação explícita do usuário
- [ ] ADR-009 (cutover) ratificado

## Objetivo (fase futura)

Migrar o frontend de **Vite SPA** para **Next.js App Router** em monorepo único:

| Rota | Conteúdo |
|------|----------|
| `/public/*` | Portal público (SSR/SSG para SEO) |
| `/login`, `/app/*` | ERP autenticado (client components + JWT) |

A **API Express** (`backend/`) permanece separada — sem reescrita do backend.

## Fora de escopo inicial

- Reescrever backend ou Prisma
- PIX produção, contabilidade (epics próprios)
- Migração durante Sprint 2 ou 3 do financeiro v2

## Fases previstas (rascunho)

1. **Spike** — Next.js + auth JWT + proxy `/api` + deploy nginx/Docker
2. **Portal** — migrar `/public/*` com SSR onde fizer sentido
3. **ERP** — migrar `/app/*` e login
4. **Cutover** — dual-run, purge CF, desativar `frontend/dist` Vite
5. **Cleanup** — remover Vite ou manter só legacy até estabilizar

## Pipeline

- Manter CI verde durante migração (Vite build até cutover final).
- Novo workflow Next só após spike validado — não alterar deploy VPS atual até fase 4.

## Critérios de aceite (alto nível)

- [ ] `/public` indexável (meta, sitemap) sem regressão LGPD
- [ ] ERP login + RBAC equivalente ao Vite
- [ ] Deploy VPS documentado em runbook dedicado
- [ ] Rollback para dist Vite documentado (72h pós-cutover)

## TDD

Cada fase: spec → tasks → testes (Playwright/Vitest) antes de implementação — mesmo ciclo SDD do projeto.
