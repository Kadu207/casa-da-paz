# Tasks — 032 Ingressos / lotes

- [x] Spec + ADR-013 + rbac-matrix
- [x] Prisma migration `ingresso_lotes` + campos inscrição
- [x] Lib código / vagas / capacidade de lotes + testes
- [x] API `/eventos/:id/lotes` + inscrição/cancelamento/check-in código
- [x] API pública reserva + detalhe com lotes
- [x] FE Eventos (lotes) + Recepção (código) + portal reserva
- [x] N8N ingresso (SMTP + Chatwoot) sem secrets
- [x] Runbook SMTP / WhatsApp / Telegram / Chatwoot 502
- [x] Memória / CHANGELOG / roadmap
- [ ] Deploy VPS (migrate + rebuild) — gate humano

## Validação V1 (integração) — 2026-10-27 local

| Check | OK | Ref |
|-------|----|-----|
| Rotas Express ↔ FE | ✅ | eventos + public + recepção |
| Prisma ↔ migration | ✅ | `20261027120000_ingressos_lotes_032` |
| RBAC `eventos` / `checkin` | ✅ | matrix + policies existentes |
| Reserva sem receita; pagamento com receita | ✅ | public reserva + PATCH pagamento |
| Check-in por código | ✅ | smoke API + UI código na recepção |
| Portal reserva | ✅ | browser: código `6BWHD6SM`, 1/30 inscritos |

## Validação V2 (qualidade)

| Check | OK |
|-------|----|
| Constitution (RBAC backend, deploy gate, ADR) | ✅ |
| Vitest ingressos + FE/BE tsc | ✅ |
| Docs / memória | ✅ |
| Deploy | gate humano |
