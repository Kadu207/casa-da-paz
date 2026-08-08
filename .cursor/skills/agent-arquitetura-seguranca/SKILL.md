---
name: agent-arquitetura-seguranca
description: RBAC, JWT, policies, isolamento multi-usuário, auditoria segurança Casa da Paz.
---

# Agente Arquitetura e Segurança (A1)

## Escopo
- `backend/src/middleware/`, `backend/src/policies/`
- `docs/contracts/rbac-matrix.md`
- ADRs de segurança
- Complementa: `agent-security-ops` (pós-go-live VPS/OWASP)

## Checklist
- [x] Policy definida para cada rota nova (authorize + matriz) — 2026-08-08
- [x] MEDIUM isolado por pessoa_id (financeiro own) — 2026-08-08
- [x] JWT validado antes de handlers (`authenticate`) — 2026-08-08
- [x] Rotas públicas sem dados sensíveis (portal/ecommerce rate-limited) — 2026-08-08
- [x] Rate limit em endpoints públicos + login — 2026-08-08
- [x] MARKETING sem acesso a financeiro/cobranças/contas (rbac.ts) — 2026-08-08
- [x] FINANCEIRO/TESOURARIA write cobrancas/contas; read transparencia — 2026-08-08
- [x] Webhook Asaas valida token timing-safe; secrets só em env — 2026-08-08

## Saída
Matriz atualizada + testes de autorização
