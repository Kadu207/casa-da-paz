# Feature 025 — Conciliação bancária OFX

**Status:** ✅ Implementado | **Sem Asaas** | **Atualizado:** 2026-08-06

Import OFX → `OfxMovimento` (`fitId` único). Match valor+data±2d com ledger. UI Extrato OFX.

## API / UI
- `/api/financeiro/ofx/import`, `/movimentos`, conciliar/ignorar
- `/app/financeiro/ofx`
