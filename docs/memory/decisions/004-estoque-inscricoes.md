# ADR-004: Estoque e Inscrições

**Status:** Aceito | **Data:** 2026-06-05

## Contexto
PDF exige livraria com baixa automática e oficinas com lotação/pagamento.

## Decisão
Novas entidades Prisma:
- `Produto` (tipo: LIVRO, ERVA, ARTIGO)
- `EstoqueMovimentacao` (ENTRADA, SAIDA) — vinculada a venda PDV
- `Inscricao` (evento_id, pessoa_id, valor, status_pagamento)
- `Evento.capacidadeMax` — bloqueia inscrições quando lotado

## Consequências
- PDV atômico: transação financeira + movimentação estoque
- Ingresso digital via N8N após `status = CONCLUIDO`
