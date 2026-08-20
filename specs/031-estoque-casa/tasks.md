# Tasks 031 — Estoque primário

## Fase dados
- [x] Spec + ADR 010
- [x] Migration ItemEstoqueCasa / Movimentacao / GrupoLimpeza / Checklist
- [x] Seed catálogo ritualística + limpeza

## Fase segurança
- [x] Resource `estoque_casa` em rbac.ts + matriz
- [x] Enrich effectiveGrants se responsável de grupo
- [x] Testes policy

## Fase API
- [x] Rotas itens / movimentações
- [x] Rotas grupos / checklists (transação)
- [x] Relatório + alerta mínimo

## Fase FE
- [x] Menu + RequireRole + i18n
- [x] EstoqueCasaPage (5 abas)

## Gate
- [x] Docs rbac/rotas + project-memory + CHANGELOG
- [ ] Deploy VPS (aguardar confirmação do usuário)
