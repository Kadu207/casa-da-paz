---
name: agent-recorrencia-mensalidade
description: Gera mensalidades recorrentes de médiuns sem depender de Asaas.
---

# Agente Recorrência Mensalidade

## Escopo
- `MensalidadePlano` + job `gerar-mensalidades.ts`
- Spec 023

## Checklist
- [x] Planos ativos com diaVencimento 1–28 (schema + API) — 2026-08-08
- [x] Job não duplica MENSALIDADE PENDENTE do mês — 2026-08-08
- [x] Médium vê lançamento no painel próprio (own) — 2026-08-08
- [x] Independente de ASAAS_API_KEY — 2026-08-08
