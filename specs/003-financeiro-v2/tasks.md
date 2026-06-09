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

- [ ] `[R]` Teste: DELETE transação vinculada a inscrição ativa → 409
- [ ] `[G]` Checagem antes do delete

---

## Sprint 2 — Conciliação, export, métricas

### S2.1 Conciliação mensal

- [ ] `[R]` Teste: `GET /financeiro/conciliacao?mes=6&ano=2026`
- [ ] `[R]` Teste: POST fechar duplicado → 409
- [ ] `[R]` Teste: DELETE fechamento só DIRETORIA
- [ ] `[G]` Rotas conciliação + audit log

### S2.2 Export

- [ ] `[R]` Teste: `GET /financeiro/export.csv` Content-Type + colunas
- [ ] `[R]` Teste: `GET /financeiro/export.pdf` retorna PDF
- [ ] `[G]` Handlers stream CSV (padrão `auditoria/export.csv`)

### S2.3 Histórico por pessoa

- [ ] `[R]` Teste: MEDIUM 403 em pessoa alheia
- [ ] `[G]` `GET /financeiro/pessoas/:pessoaId/historico`

### S2.4 Dashboard período

- [ ] `[R]` Teste: `/metricas/resumo?mes=6&ano=2026` filtra financeiro
- [ ] `[G]` Evolução em `metricas.ts`

---

## Sprint 3 — Frontend + integração

### S3.1 Navegação

- [ ] `[G]` Sub-nav Financeiro (4 abas) em layout compartilhado
- [ ] `[G]` Rotas em `App.tsx` + `RequireRole`

### S3.2 Lançamentos

- [ ] `[G]` Filtros período/tipo/categoria/status/adimplência
- [ ] `[G]` Paginação + modal editar + confirmar excluir
- [ ] `[G]` i18n pt-BR + en

### S3.3 Fluxo de caixa

- [ ] `[G]` `FinanceiroFluxoPage`: KPIs + Recharts barras/linha
- [ ] Smoke: selecionar mês anterior atualiza gráficos

### S3.4 Atrasados

- [ ] `[G]` `FinanceiroAtrasadosPage`: checkbox + batch pagar
- [ ] `[G]` Coluna dias atraso

### S3.5 Conciliação

- [ ] `[G]` `FinanceiroConciliacaoPage`: checklist, export, fechar mês
- [ ] `[G]` Histórico 12 meses + badge fechado

### S3.6 Gates

- [ ] `validador-integracao`: contratos API ↔ UI ↔ RBAC
- [ ] `validador-qualidade`: lint + test + i18n completo
- [ ] Atualizar `project-memory.md` + CHANGELOG

---

## Ordem de execução imediata (esta sessão)

1. ~~S1.2 fluxo-caixa (lib + rota)~~ — concluído
2. ~~S1.1 migration fechamentos~~ — concluído
3. ~~S1.3 listagem paginada~~ — concluído
4. S1.4 batch status
