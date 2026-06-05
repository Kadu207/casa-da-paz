# 8. Desenvolvimento

## 8.1. Scripts

```bash
bun install          # instalar deps
bun run dev          # vite dev
bun run build        # build de produção
bun run build:dev    # build dev (com source maps)
bun run preview      # preview do build
bun run lint         # eslint
bun run test         # vitest run
bun run format       # prettier
```

## 8.2. Variáveis de Ambiente

### Cliente (`import.meta.env.VITE_*`) — em `.env`, gerenciado pelo Cloud
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_SUPABASE_PROJECT_ID`

### Servidor (`process.env.*`) — runtime no Worker
- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (nunca expor)
- `TURNSTILE_SECRET_KEY` (captcha)

## 8.3. Convenções de Código

- **Server functions**: arquivos `*.functions.ts` em `src/lib/`, helpers servidor em `*.server.ts`. Nunca importar `*.server.ts` em código cliente.
- **Rotas**: nomeação ponto-separada (`_authenticated.admin.eventos.tsx`). Plugin Vite gera `routeTree.gen.ts` automaticamente — **nunca editar à mão**.
- **Imports**: usar `@tanstack/react-router` (não `react-router-dom`).
- **Hooks**: `useRouter()` standalone, nunca `Route.useRouter()`.
- **Imagens**: sempre `<SafeImage>`, nunca `<img>` direto em telas críticas.
- **Cores**: apenas tokens semânticos do `styles.css`.

## 8.4. Testes

`vitest` em `tests/`. Executar com `bun run test`.

## 8.5. Deploy

- Lovable Cloud gerencia deploy automaticamente.
- URLs estáveis:
  - Produção: `project--aaacf821-2ee4-4d25-8c43-cfa7e3b27388.lovable.app`
  - Preview: `project--aaacf821-2ee4-4d25-8c43-cfa7e3b27388-dev.lovable.app`
- Edge functions Supabase **não são usadas** — toda lógica de servidor é `createServerFn` no TanStack.

## 8.6. Migrations

Adicionar nova migration via tool de migração do ambiente (gera SQL aprovado pelo usuário). Estrutura obrigatória de toda nova tabela em `public`:

```sql
CREATE TABLE public.<nome> (...);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.<nome> TO authenticated;
GRANT ALL ON public.<nome> TO service_role;
ALTER TABLE public.<nome> ENABLE ROW LEVEL SECURITY;
CREATE POLICY ... ;
```

## 8.7. Arquivos NUNCA editar manualmente

- `src/integrations/supabase/client.ts`
- `src/integrations/supabase/client.server.ts`
- `src/integrations/supabase/auth-middleware.ts`
- `src/integrations/supabase/auth-attacher.ts`
- `src/integrations/supabase/types.ts`
- `.env`
- `src/routeTree.gen.ts`
