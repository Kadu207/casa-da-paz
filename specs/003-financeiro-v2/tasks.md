# Tasks 003-financeiro-v2 — TDD por sprint

Legenda: `[R]` Red (teste falha) → `[G]` Green (implementação) → `[RF]` Refactor

---

## Sprint 1 — Backend core (listagem, fluxo, batch)

### S1.1 Migration e schema

- [ ] `[R]` Teste de schema: `FinanceiroFechamentoMensal` unique `(ano, mes)` — via migrate deploy em CI
- [x] `[G]` Prisma: model `FinanceiroFechamentoMensal` + índices em `FinanceiroTransacao`
- [x] `[G]` Migration `20260608120000_financeiro_v2`

### S1.2 Fluxo de caixa (lib pura + rota)

- [x] `[R]` `fluxo-caixa.test.ts`: `resolverPeriodo`, `agruparPorSemana`, `calcularTotaisPendentes`
- [x] `[G]` `backend/src/lib/fluxo-caixa.ts`
- [x] `[G]` `GET /api/financeiro/fluxo-caixa` em `financeiro.ts`
- [ ] `[RF]` Extrair helpers se rota > 40 linhas

### S1.3 Listagem paginada

- [x] `[R]` Teste: `parseListagemQuery`, `buildListagemWhere`, `parsePaginacao`
- [x] `[G]` Query params + meta `{ page, limit, total, totalPages }`
- [x] `[G]` Compat: sem `page` → array legado (deprecar v0.2)

### S1.4 Batch status

- [x] `[R]` Teste: `planBatchStatusUpdate` com ids mistos
- [x] `[G]` `POST /financeiro/batch/status` idempotente + RBAC MEDIUM bloqueado (middleware write)

### S1.5 DELETE com vínculo inscrição

- [x] `[R]` Teste: `bloqueiaDeleteTransacao` inscrição/estoque
- [x] `[G]` Checagem antes do delete (409)

---

## Sprint 2 — Conciliação, export, métricas

### S2.1 Conciliação mensal

- [x] `[R]` Teste: `buildConciliacaoChecklist`, `snapshotFechamento`
- [x] `[G]` `GET/POST/DELETE /financeiro/conciliacao/*` + audit log

### S2.2 Export

- [x] `[R]` Teste: CSV colunas + PDF buffer
- [x] `[G]` `GET /financeiro/export.csv` e `export.pdf`

### S2.3 Histórico por pessoa

- [x] `[R]` Teste: `buildHistoricoResumo`
- [x] `[G]` `GET /financeiro/pessoas/:pessoaId/historico` + MEDIUM 403

### S2.4 Dashboard período

- [x] `[R]` Teste: `parseMetricasPeriodo`
- [x] `[G]` `/metricas/resumo?mes=&ano=` filtra financeiro

---

## Sprint 3 — Frontend + integração

**Status:** ✅ Implementado (2026-06-09) — aguarda deploy frontend + gates S3.6

### S3.1 Navegação

- [x] `[G]` Sub-nav Financeiro (4 abas) em layout compartilhado
- [x] `[G]` Rotas em `App.tsx` + `RequireRole`

### S3.2 Lançamentos

- [x] `[G]` Filtros período/tipo/categoria/status/adimplência
- [x] `[G]` Paginação + modal editar + confirmar excluir
- [x] `[G]` i18n pt-BR + en

### S3.3 Fluxo de caixa

- [x] `[G]` `FinanceiroFluxoPage`: KPIs + Recharts barras/linha
- [ ] Smoke: selecionar mês anterior atualiza gráficos

### S3.4 Atrasados

- [x] `[G]` `FinanceiroAtrasadosPage`: checkbox + batch pagar
- [x] `[G]` Coluna dias atraso

### S3.5 Conciliação

- [x] `[G]` `FinanceiroConciliacaoPage`: checklist, export, fechar mês
- [x] `[G]` Histórico 12 meses + badge fechado

### S3.6 Gates

- [x] `validador-integracao`: contratos API ↔ UI ↔ RBAC (2026-06-09)
- [x] `validador-qualidade`: build + 70 testes backend + i18n
- [ ] Smoke manual produção (fluxo mês anterior, batch pagar, fechar mês)
- [x] Atualizar `project-memory.md` + CHANGELOG

---

## Ordem de execução

1. ~~S1 backend~~ — concluído + produção
2. ~~S2 backend~~ — concluído + produção
3. **S3 UI Vite** — implementado; deploy + gates pendentes (ADR-008: Next.js só após S3)
4. **016-frontend-nextjs** — ver `docs/memory/roadmap-cronograma.md`
