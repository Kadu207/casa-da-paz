# Feature 020 — RBAC hierárquico + policies configuráveis

**Status:** ✅ V1 implementada | **Data:** 2026-06-26 | **Atualizado:** 2026-08-06 (policies no ato do cadastro)

## Hierarquia

| Papel | Escopo |
|-------|--------|
| **SUPERVISOR** | Master operacional: usuários, políticas, cadastros, manutenção |
| **ADMIN** | Integrações: webhooks N8N, logs, manutenção read |
| **Operacionais** | DIRETORIA, FINANCEIRO, RECEPCAO, LIVRARIA, MEDIUM, SUPORTE — policies via `usuario_policies` |

## API

- `POST /api/auth/usuarios` — cria usuário **e** `UsuarioPolicy` (snapshot do setor + overrides opcionais em `grants`)
- `GET/PUT /api/auth/usuarios/:id/politicas` (SUPERVISOR)
- `GET /api/auth/politicas/catalogo` (SUPERVISOR)

## Seed produção (sem resetar admin)

```bash
npx tsx prisma/seed.ts --supervisor-only
# ou: npm run db:seed-supervisor
```

## Matriz

`docs/contracts/rbac-matrix.md`
