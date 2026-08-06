# Feature 022 — Contas a pagar + agenda

**Status:** Em implementação | **Sem Asaas**

## Objetivo
Fornecedores, contas a pagar com parcelas, baixas no ledger e agenda **Pagamentos a fazer** separada de Atrasados (receber).

## Modelos
Fornecedor, ContaPagar, ContaPagarParcela → baixa cria FinanceiroTransacao DESPESA.

## UI
`/app/financeiro/pagamentos`, `/contas-pagar`, `/fornecedores`
