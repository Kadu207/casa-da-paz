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
- [x] fitId único (idempotência) — 2026-08-08
- [x] Match só em PENDENTE — 2026-08-08
- [x] IGNORAR não cria lançamento — 2026-08-08
- [x] ContaFinanceira vinculada ao import — 2026-08-08
