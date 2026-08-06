---
name: agent-conciliacao-bancaria
description: Import OFX, matching com ledger e divergências Casa da Paz.
---

# Agente Conciliação Bancária (OFX)

## Escopo
- Import extrato OFX → `OfxMovimento`
- Match por valor + data ±2 dias
- Spec 025

## Checklist
- [ ] fitId único (idempotência)
- [ ] Match só em PENDENTE
- [ ] IGNORAR não cria lançamento
- [ ] ContaFinanceira vinculada ao import
