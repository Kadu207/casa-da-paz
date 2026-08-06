---
name: agent-recorrencia-mensalidade
description: Gera mensalidades recorrentes de médiuns sem depender de Asaas.
---

# Agente Recorrência Mensalidade

## Escopo
- `MensalidadePlano` + job `gerar-mensalidades.ts`
- Spec 023

## Checklist
- [ ] Planos ativos têm diaVencimento 1–28
- [ ] Job não duplica MENSALIDADE PENDENTE do mês
- [ ] Médium vê lançamento no painel próprio
- [ ] Independente de ASAAS_API_KEY
