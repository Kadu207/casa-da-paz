# ADR-003: Status Transação vs Adimplência

**Status:** Aceito | **Data:** 2026-06-05

## Contexto
MD usa `PENDENTE`/`CONCLUIDO`. PDF usa `EM_DIA`/`ATRASADO`/`PAGO` com vencimento.

## Decisão
Dois conceitos separados:

| Campo | Valores | Uso |
|-------|---------|-----|
| `status` | PENDENTE, CONCLUIDO | Estado da transação financeira |
| `vencimento` | DATE | Data limite para pagamento |
| `adimplencia` | EM_DIA, ATRASADO, PAGO | **Calculado** — não persistido como fonte primária |

### Regra de cálculo
```
se status = CONCLUIDO → PAGO
senão se hoje > vencimento → ATRASADO
senão → EM_DIA
```

Job diário (`backend/src/jobs/adimplencia.ts`) recalcula e gera `Alertas`.

## Consequências
- Campo `vencimento` obrigatório em mensalidades e inscrições
- Dashboard administrativo usa `adimplencia` derivada
- N8N consome endpoint `/api/financeiro/atrasados` para lembretes
