# Feature 001 — Auth + RBAC

## User Stories
- Como diretoria, quero CRUD de usuários para gerenciar acessos
- Como usuário, quero login JWT para acessar módulos do meu setor

## Acceptance
- [x] POST /api/auth/login retorna JWT
- [x] Middleware bloqueia rotas sem permissão
- [x] CRUD usuários restrito a DIRETORIA
- [x] Frontend oculta menu por setor_acesso
