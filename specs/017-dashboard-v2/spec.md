# Feature 017 — Dashboard v2 (filtro por período)

**Status:** ✅ Concluído (2026-06-09)  
**Personas:** DIRETORIA, FINANCEIRO  
**Depende:** `GET /api/metricas/resumo?mes=&ano=` (financeiro S2)

## Objetivo

Dashboard interno com **seletor mês/ano** alinhado ao financeiro v2: KPIs e gráficos de receitas/despesas refletem o período escolhido (padrão: mês corrente).

## Escopo

| In | Fora |
|----|------|
| Seletor mês/ano no `DashboardPage` | Painel Médium (018) |
| KPIs financeiros filtrados por período | Next.js / SSR |
| Gráficos receita/despesa por categoria no período | Filtro operacional global |
| Link rápido → `/app/financeiro/fluxo` | Export PDF dashboard |

## API

`GET /metricas/resumo?mes=6&ano=2026`

- **Financeiro:** transações com `dataTransacao` no período (CONCLUIDO + PENDENTE para pendentes/atrasadas).
- **Operacional:** snapshot atual (pessoas, agendamentos, eventos abertos) — exceto **presenças** filtradas pelo período quando `mes`/`ano` informados.
- **Resposta:** inclui `periodo: { mes, ano, de, ate } | null`.

## RBAC

- `authorize('dashboard', 'read')` — DIRETORIA, FINANCEIRO (matriz existente).
- MEDIUM continua com placeholder (018).

## Acceptance

- [ ] Seletor mês/ano altera KPIs financeiros e gráficos de categoria
- [ ] Default = mês corrente
- [ ] i18n pt-BR + en
- [ ] Link "Fluxo de caixa" com mesmo período
- [ ] Build + testes backend passando
