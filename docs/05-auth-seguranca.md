# 5. Autenticação e Segurança

## 5.1. Auth

- **Provedores**: email/senha e Google OAuth (Supabase Auth gerenciado via Lovable Cloud).
- **Confirmação de email**: ativa (usuário precisa verificar email antes de logar). Não usar auto-confirm.
- **Sessão**: persistida em `localStorage` pelo browser client.
- **Bearer token**: `attachSupabaseAuth` (registrado em `src/start.ts` como `functionMiddleware`) anexa `Authorization: Bearer <access_token>` em toda chamada `createServerFn`.
- **Gate de rota**: `_authenticated.tsx` valida sessão no `beforeLoad` → redireciona para `/login` se ausente. Subpastas `/admin` validam role `admin`.

## 5.2. Roles e Autorização

- Roles em `public.user_roles` (enum `app_role`).
- Função `public.has_role(uuid, app_role)` `SECURITY DEFINER` usada em policies RLS.
- Verificação client-side é apenas UX — toda decisão real é feita por RLS no Postgres.

## 5.3. Rate Limit e Captcha

- `src/lib/rate-limit.server.ts`: rate limit em memória por IP para endpoints sensíveis (login, agendamento).
- `src/lib/turnstile.server.ts` + `Turnstile.tsx`: Cloudflare Turnstile no formulário de agendamento e contato.

## 5.4. Auditoria

Ações que geram registro em `admin_audit_log`:

| Ação | `rota` | Quando |
| --- | --- | --- |
| Login admin | `admin.login` | sucesso de login com role admin |
| Criar evento | `admin.eventos.create` | POST de novo evento |
| Atualizar evento | `admin.eventos.update` | PATCH em evento |
| Excluir evento | `admin.eventos.delete` | DELETE de evento |
| Alterar role de usuário | `admin.usuarios.role.update` | mudança de role |
| Exportar CSV | `admin.auditoria.export.csv` | download CSV |
| Exportar PDF | `admin.auditoria.export.pdf` | download PDF |

Cada registro contém `user_id`, `papel`, `rota`, `motivo`, `ip`, `user_agent`, `created_at`.

## 5.5. Boas práticas adotadas

- Nenhum secret/service-role em código cliente.
- `client.server.ts` (admin) só importado em servidor.
- Validação Zod em todo input de servidor (`min`/`max`/regex).
- Sem CHECK constraints com `now()` — validações temporais via trigger.
- Smart quotes e XML entities preservados em conteúdo gerado.
- Sem armazenamento de role em `profiles` (evita escalonamento de privilégio).
