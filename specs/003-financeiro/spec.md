# Feature 003 — Financeiro + Adimplência (ADR-003)

## Acceptance
- [x] CRUD transações com categorias receita/despesa
- [x] `adimplencia` derivada (EM_DIA, ATRASADO, PAGO) — não persistida
- [x] Vencimento obrigatório em MENSALIDADE/EVENTOS/OFICINAS
- [x] Filtro por adimplência, endpoint `/atrasados`, job `sync-alertas`
- [x] FinanceiroPage com CRUD e marcar pago
- [x] Isolamento MEDIUM por `pessoa_id`
