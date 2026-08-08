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
- [x] Canal receber vs pagar separados na UI/API — 2026-08-08
- [x] Rate limit em rotas públicas; alertas autenticados — 2026-08-08
- [x] FINANCEIRO/DIRETORIA/TESOURARIA veem alertas (RBAC) — 2026-08-08
