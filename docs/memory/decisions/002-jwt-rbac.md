# ADR-002: JWT + RBAC Backend-First

**Status:** Aceito | **Data:** 2026-06-05 | **Atualizado:** 2026-08-06

## Contexto
Sistema multi-setor com isolamento MEDIUM e princípio do menor privilégio.

## Decisão
- Autenticação JWT (access token 8h, refresh opcional fase 2)
- Autorização **obrigatória** no middleware Express antes de handlers
- Frontend oculta rotas por grants — defesa em profundidade apenas
- Matriz canônica em `docs/contracts/rbac-matrix.md`
- Papéis: SUPERVISOR / ADMIN / operacionais
- Overrides por usuário em `usuario_policies.grants`
- **No cadastro:** `POST /auth/usuarios` cria `UsuarioPolicy` com snapshot do setor + overrides (`snapshotGrantsForSetor`) — o SUPERVISOR define o nível de acesso no ato

## Consequências
- Todo endpoint novo exige resource em `RBAC_RESOURCES` + policy na matriz
- Testes de autorização / snapshot no CI
- Usuários sem policy legados usam defaults do setor até edição explícita
