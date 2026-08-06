# Feature — Contribuintes (patrocínios e padrinhos)

**Status:** ✅ Implementado | **Atualizado:** 2026-08-06  
**Escopo:** complemento da tesouraria (pós 022–025)

## Objetivo
Cadastro de patrocínios e padrinhos com **nome** e **valor da contribuição**, separado das mensalidades de médiuns.

## Modelo
`Contribuinte` — `tipo` PATROCINIO | PADRINHO, `nome`, `valor`, `telefone?`, `ativo`, `observacao?`

## API / UI / RBAC
- `/api/contribuintes` — resource `contribuintes`
- `/app/financeiro/contribuintes`
- Write: FINANCEIRO / DIRETORIA / SUPERVISOR
