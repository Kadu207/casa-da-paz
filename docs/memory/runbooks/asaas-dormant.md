# Asaas PSP — estado dormant (021)

**Atualizado:** 2026-08-20

## Status

**Dormant em produção** até existir `ASAAS_API_KEY` válida + confirmação explícita do usuário.

| Item | Estado |
|------|--------|
| Código 021 | ✅ no `main` |
| ContaFinanceira / cobranças / webhook | ✅ implementados |
| Chave produção | ❌ ausente |
| Tesouraria 022–025 | Opera **sem** Asaas |

## Gate de ativação

1. Definir `ASAAS_ENV=sandbox` (primeiro) ou `production` com confirmação  
2. Preencher `ASAAS_API_KEY` (+ webhook token) em `infra/.env.production`  
3. Redeploy backend  
4. Smoke: `scripts/test-financeiro-asaas.ps1` (sandbox)  
5. Só então produção + confirmação humana  

## Não fazer

- Commitar chave no Git  
- Ativar produção sem sandbox prévio  
- Bloquear tesouraria por falta de PSP  

Refs: ADR-009, `specs/021-financeiro-asaas-gestor/`, `docs/memory/runbooks/deploy.md`
