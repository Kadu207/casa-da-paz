# 2. Arquitetura

## 2.1. Estrutura de Pastas

```
src/
├── assets/                 # Imagens da identidade umbandista (Iemanjá, pretos velhos, atabaque, ervas, velas)
├── components/
│   ├── EventoForm.tsx      # Formulário criar/editar evento (admin)
│   ├── PublicLayout.tsx    # Layout do site público (header/footer)
│   ├── RouteFallbacks.tsx  # Skeletons e estados vazios
│   ├── SafeImage.tsx       # <img> tolerante a falha de CDN, com srcSet/lazy/telemetria
│   ├── ShareEvento.tsx     # Compartilhamento de evento
│   ├── Turnstile.tsx       # Captcha Cloudflare
│   └── ui/                 # shadcn/ui (botão, card, dialog, table, etc.)
├── data/                   # Dados estáticos (fallback de eventos)
├── hooks/                  # Hooks customizados
├── integrations/supabase/  # Clients gerados (NÃO EDITAR)
│   ├── client.ts           # Browser client (anon key, RLS aplicado)
│   ├── client.server.ts    # Admin client (service role, BYPASS RLS)
│   ├── auth-middleware.ts  # requireSupabaseAuth para serverFn
│   ├── auth-attacher.ts    # Anexa Bearer token nas RPC
│   └── types.ts            # Tipos gerados do schema
├── lib/
│   ├── agendar-schema.ts   # Zod schema do agendamento
│   ├── auditoria.functions.ts  # ServerFn para o admin_audit_log
│   ├── auth.functions.ts   # ServerFn de login/logout/role-check
│   ├── eventos-store.ts    # CRUD de eventos via serverFn
│   ├── ics.ts              # Geração de arquivo .ics (calendário)
│   ├── image-telemetry.ts  # Métricas de fallback de imagens
│   ├── rate-limit.server.ts# Rate limit por IP
│   ├── turnstile.functions.ts/.server.ts  # Validação do captcha
│   └── utils.ts            # cn() e helpers
├── routes/                 # File-based routing (ver seção 3)
│   ├── __root.tsx          # Layout raiz (HTML/head/body)
│   ├── _authenticated.tsx  # Layout protegido (gate /admin/*)
│   ├── api/public/         # Endpoints públicos (webhooks/health)
│   └── ... rotas públicas e admin
├── routeTree.gen.ts        # Auto-gerado — NÃO editar
├── router.tsx              # Configuração do router (QueryClient, fallbacks)
├── server.ts / start.ts    # Entradas SSR
└── styles.css              # Tokens de design (oklch), Tailwind v4
```

## 2.2. Camadas

### Frontend (React 19 + TanStack Router)
- Renderização SSR por padrão.
- Rotas declaradas como arquivos; `routeTree.gen.ts` gerado pelo plugin Vite.
- Estado de servidor via TanStack Query (preload no loader → `useSuspenseQuery` no componente).

### Server Functions (`createServerFn`)
- Toda lógica de servidor da aplicação (CRUD, auth) usa `createServerFn` do `@tanstack/react-start`.
- Protegidas por middleware `requireSupabaseAuth` quando exigem sessão.
- Lêem secrets via `process.env` dentro do `.handler()`.

### Server Routes (`src/routes/api/public/`)
- Endpoints HTTP públicos (ex.: health-check, webhooks).
- Validam input com Zod, verificam assinaturas quando aplicável.

### Backend (Lovable Cloud / Supabase)
- Postgres com Row Level Security em todas as tabelas.
- Auth via email/senha + Google OAuth.
- Roles armazenadas em tabela separada `user_roles` (nunca em `profiles`) — função `has_role()` SECURITY DEFINER.

## 2.3. Fluxo de Dados (read)

1. Usuário navega para rota.
2. `loader` chama `queryClient.ensureQueryData(queryOptions)`.
3. Componente usa `useSuspenseQuery(queryOptions)` — dados já em cache.
4. ServerFn é invocada com `Authorization: Bearer <token>` injetado por `attachSupabaseAuth`.
5. Middleware valida sessão, instancia `supabase` client autenticado, executa query (RLS aplica).

## 2.4. Fluxo de Imagens (CDN + Fallback)

Componente `SafeImage` (`src/components/SafeImage.tsx`):
- Lazy loading por padrão (`loading="lazy"`).
- `srcSet` responsivo (320/640/960/1280px) via helper `buildSrcSet(url, widths)`.
- `useEffect` checa `img.complete`/`naturalWidth` no mount para imagens em cache.
- Em falha (`onError`): renderiza placeholder com gradiente temático e reporta via `reportImageFallback`.
- Imagens above-the-fold (hero, banner) usam `<link rel="preload" fetchpriority="high">` no `head()` da rota.
