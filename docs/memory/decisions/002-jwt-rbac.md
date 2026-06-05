# ADR-002: JWT + RBAC Backend-First

**Status:** Aceito | **Data:** 2026-06-05

## Contexto
Sistema multi-setor com isolamento MEDIUM e princípio do menor privilégio.

## Decisão
- Autenticação JWT (access token 8h, refresh opcional fase 2)
- Autorização **obrigatória** no middleware Express antes de handlers
- Frontend oculta rotas por `setor_acesso` — defesa em profundidade apenas
- Matriz canônica em `docs/contracts/rbac-matrix.md`

## Consequências
- Todo endpoint novo exige policy em `backend/src/policies/`
- Testes de autorização por rota no CI
