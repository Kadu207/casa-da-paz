# Feature 031 — Estoque primário da Casa

**Status:** ✅ Implementado | **Atualizado:** 2026-08-20

## Objetivo

Almoxarifado **primário** de insumos de funcionamento/ritualística (charutos, bebidas, velas, limpeza, etc.), separado da Livraria/PDV e de ingressos de eventos.

## Taxonomia

| Prioridade | Estoque | Estado |
|------------|---------|--------|
| Primário | Estoque da Casa (`estoque_casa`) | Esta feature |
| Secundário | Livraria/PDV (`estoque`) | Existente |
| Secundário | Ingressos/eventos | Futuro |
| Outros | Extensões | Futuro |

## Modelos

`ItemEstoqueCasa`, `MovimentacaoEstoqueCasa`, `GrupoLimpeza`, `ChecklistLimpeza`, `ChecklistLimpezaItem`

## RBAC

Resource `estoque_casa`: write para SUPERVISOR, ADMIN, DIRETORIA, TESOURARIA. MEDIUM via policy override **ou** como responsável de grupo ativo.

## API

`/api/estoque-casa/*` — itens, movimentações, grupos, checklists, relatório

## UI

Menu ERP **Estoque** → `/app/estoque` (abas: itens, movimentações, grupos, checklist, relatório)

## Referências

- ADR: `docs/memory/decisions/010-estoque-casa.md`
- ADR-004 (livraria): `docs/memory/decisions/004-estoque-inscricoes.md`
- Matriz: `docs/contracts/rbac-matrix.md`
