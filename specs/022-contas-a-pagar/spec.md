# Feature 022 — Contas a pagar + agenda

**Status:** ✅ Implementado | **Sem Asaas** | **Atualizado:** 2026-08-06

## Objetivo
Fornecedores, contas a pagar com parcelas, baixas no ledger e agenda **Pagamentos a fazer** separada de Atrasados (receber).

## Modelos
Fornecedor, ContaPagar, ContaPagarParcela → baixa cria FinanceiroTransacao DESPESA.

## API
`/api/fornecedores`, `/api/contas-pagar`, `/api/financeiro/pagamentos-a-fazer`

## UI
`/app/financeiro/pagamentos`, `/app/financeiro/contas-pagar`
