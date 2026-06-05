# 4. Banco de Dados

Backend Postgres gerenciado pelo Lovable Cloud. Todas as tabelas em `public` possuem RLS habilitado e GRANTs explícitos.

## 4.1. Tabelas

### `profiles`
Perfil do usuário, espelha (via trigger) `auth.users`.

| Coluna | Tipo | Notas |
| --- | --- | --- |
| `id` | `uuid` | PK, referencia `auth.users.id` |
| `nome` | `text` | |
| `email` | `text` | |
| `created_at` | `timestamptz` | default `now()` |
| `updated_at` | `timestamptz` | trigger atualiza |

**RLS**: usuário lê/atualiza apenas o próprio profile; admin lê todos.

### `user_roles`
Roles do usuário (tabela separada — nunca colocar role em `profiles`).

| Coluna | Tipo | Notas |
| --- | --- | --- |
| `id` | `uuid` | PK |
| `user_id` | `uuid` | FK `auth.users` ON DELETE CASCADE |
| `role` | `app_role` (enum: `admin`, `moderator`, `user`) | |
| `created_at` | `timestamptz` | |

Constraint única `(user_id, role)`.

**Função `has_role(_user_id uuid, _role app_role) returns boolean`** — `SECURITY DEFINER`, usada por RLS de outras tabelas para evitar recursão.

### `eventos`
Eventos públicos (giras, festas).

| Coluna | Tipo | Notas |
| --- | --- | --- |
| `id` | `uuid` | PK |
| `slug` | `text` | único, usado na URL |
| `nome_evento` | `text` | |
| `data_evento` | `timestamptz` | |
| `local` | `text` | |
| `resumo` | `text` | |
| `descricao` | `text[]` | parágrafos |
| `recomendacoes` | `text[]` | itens (vestimenta, idade etc.) |
| `capacidade_max` | `int` | nullable |
| `inscricoes` | `int` | default 0 |
| `publicado` | `bool` | default false |
| `ordem` | `int` | ordenação custom |
| `created_at` / `updated_at` | `timestamptz` | |

**RLS**:
- SELECT: público quando `publicado = true`; admin lê tudo.
- INSERT/UPDATE/DELETE: apenas `has_role(auth.uid(), 'admin')`.

### `admin_audit_log`
Registro de ações administrativas relevantes.

| Coluna | Tipo | Notas |
| --- | --- | --- |
| `id` | `uuid` | PK |
| `user_id` | `uuid` | nullable (caso ação anônima/sistema) |
| `papel` | `text` | role no momento da ação |
| `rota` | `text` | rota/ação (ex.: `admin.eventos.update`, `admin.auditoria.export.csv`) |
| `motivo` | `text` | descrição livre |
| `ip` | `text` | extraído do request |
| `user_agent` | `text` | |
| `created_at` | `timestamptz` | default `now()`, indexado |

**RLS**: SELECT/INSERT apenas para admin. Inserções via serverFn com `supabaseAdmin` ou client autenticado.

## 4.2. GRANTs (padrão de cada migration)

```sql
GRANT SELECT, INSERT, UPDATE, DELETE ON public.<tabela> TO authenticated;
GRANT ALL ON public.<tabela> TO service_role;
-- GRANT SELECT ON public.<tabela> TO anon;  -- apenas para tabelas públicas (ex.: eventos publicados)
```

## 4.3. Migrations

Pasta: `supabase/migrations/`. Estado atual: 4 migrations criando enum, tabelas, RLS, função `has_role`, trigger de profile e seeds de admin.
