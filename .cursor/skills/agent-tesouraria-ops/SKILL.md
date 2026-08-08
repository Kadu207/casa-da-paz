---
name: agent-tesouraria-ops
description: Operação diária da tesouraria Casa da Paz — contas a pagar, baixas, agenda, fechamento.
---

# Agente Tesouraria Ops (pós-construção)

## Escopo
- Contas a pagar / fornecedores / parcelas
- Agenda pagamentos a fazer
- Fechamento mensal e fluxo de caixa

## Checklist operacional
- [x] API contas a pagar / fornecedores / pagamentos-a-fazer em prod (022) — 2026-08-08
- [x] UI Financeiro → agenda / parcelas disponível — 2026-08-08
- [x] Fechamento mensal e fluxo de caixa (specs 022–025) — 2026-08-08
- [x] Não misturar atrasados (receber) com pagamentos a fazer (rotas separadas) — 2026-08-08

## API
`/api/fornecedores`, `/api/contas-pagar`, `/api/financeiro/pagamentos-a-fazer`
