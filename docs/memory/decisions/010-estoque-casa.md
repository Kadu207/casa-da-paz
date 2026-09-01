# ADR-010: Estoque primário da Casa (multi-estoque)

**Status:** Aceito | **Data:** 2026-08-20

## Contexto

A plataforma precisa controlar materiais de funcionamento/ritualística (charutos, cigarrilhas, bebidas, velas, limpeza) além do estoque de venda da livraria e, no futuro, ingressos de eventos.

## Decisão

Manter **estoques separados** (sem tabela unificada):

| Prioridade | Domínio | Resource / módulo |
|------------|---------|-------------------|
| **Primário** | Insumos da casa | `estoque_casa` → `/app/estoque` |
| Secundário | Livraria/PDV | `estoque` → `/app/livraria` (ADR-004) |
| Secundário | Ingressos/eventos | Futuro no módulo eventos |
| Outros | Extensões | Specs posteriores |

Estoque mínimo é **derivado** (`estoqueAtual <= estoqueMinimo`), sem status duplicado (espírito ADR-003).

Acesso MEDIUM: policy `estoque_casa` **write** para catálogo/movimentações; vínculo como `GrupoLimpeza.responsavelUsuarioId` concede **read** + checklist do próprio grupo (não write org-wide de itens).

## Consequências

- Menu **Estoque** no ERP aponta só ao primário
- Livraria e futuros ingressos não compartilham saldo com o almoxarifado
- Checklist de limpeza gera `SAIDA` atômica no estoque primário
