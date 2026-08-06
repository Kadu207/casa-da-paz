---
name: agent-alertas-financeiros
description: Alertas de recebíveis atrasados e pagamentos a vencer → N8N/Chatwoot.
---

# Agente Alertas Financeiros

## Escopo
- Atrasados (receber) — já em `/financeiro/atrasados`
- Vencendo (pagar) — parcelas ContaPagar
- Disparo N8N `lembrete_atraso` / futuros workflows

## Checklist
- [ ] Separar canal receber vs pagar
- [ ] Rate limit / não spam
- [ ] FINANCEIRO/DIRETORIA veem alertas
