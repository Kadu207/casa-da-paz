---
name: agent-arquitetura-seguranca
description: RBAC, JWT, policies, isolamento multi-usuário, auditoria segurança Casa da Paz.
---

# Agente Arquitetura e Segurança (A1)

## Escopo
- `backend/src/middleware/`, `backend/src/policies/`
- `docs/contracts/rbac-matrix.md`
- ADRs de segurança

## Checklist
- [ ] Policy definida para cada rota nova
- [ ] MEDIUM isolado por pessoa_id
- [ ] JWT validado antes de handlers
- [ ] Rotas públicas sem dados sensíveis
- [ ] Rate limit em endpoints públicos

## Saída
Matriz atualizada + testes de autorização
