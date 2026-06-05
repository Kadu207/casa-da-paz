# 3. Rotas

## 3.1. Rotas Públicas

| Arquivo | URL | Descrição |
| --- | --- | --- |
| `index.tsx` | `/` | Home: hero com Casa da Paz, galeria umbandista (bento grid), mapa com botões Google Maps/Waze, prévia de eventos |
| `eventos.tsx` | `/eventos` | Lista pública de eventos publicados, banner com `velasAltar`, filtros |
| `eventos.$eventoId.tsx` | `/eventos/:id` | Detalhe de evento + compartilhamento + .ics |
| `agendar.tsx` | `/agendar` | Formulário de agendamento de atendimento (com Turnstile) |
| `acompanhar.$protocolo.tsx` | `/acompanhar/:protocolo` | Acompanhamento de agendamento por protocolo |
| `contato.tsx` | `/contato` | Página de contato |
| `termos.tsx` | `/termos` | Termos de uso |
| `login.tsx` | `/login` | Login (email/senha + Google) |
| `recuperar-senha.tsx` | `/recuperar-senha` | Solicitação de reset |
| `redefinir-senha.tsx` | `/redefinir-senha` | Confirmação de novo password |
| `acesso-negado.tsx` | `/acesso-negado` | Tela 403 para não-admins |
| `health.tsx` | `/health` | Health-check público |

## 3.2. Rotas Protegidas (admin)

Todas vivem sob o layout `_authenticated.tsx`, que redireciona para `/login` se não há sessão e para `/acesso-negado` se o usuário não possui role `admin`.

| Arquivo | URL | Descrição |
| --- | --- | --- |
| `_authenticated.admin.index.tsx` | `/admin` | Dashboard administrativo |
| `_authenticated.admin.eventos.tsx` | `/admin/eventos` | Listagem/ordenação/exclusão de eventos |
| `_authenticated.admin.eventos.novo.tsx` | `/admin/eventos/novo` | Criação de evento |
| `_authenticated.admin.eventos.$eventoId.tsx` | `/admin/eventos/:id` | Edição de evento |
| `_authenticated.admin.usuarios.tsx` | `/admin/usuarios` | Gestão de usuários e roles |
| `_authenticated.admin.auditoria.tsx` | `/admin/auditoria` | Visualização de `admin_audit_log` (filtros, ordenação multi-coluna, paginação, export CSV/PDF) |

### Página de Auditoria (detalhes)

- **Filtros**: papel, rota, usuário (texto livre), intervalo de datas.
- **Ordenação**: data, usuário, papel, rota (asc/desc) — combinável com filtros e paginação.
- **Paginação**: server-side, 25 registros por página por padrão.
- **Estados**: loading skeleton, empty state ("nenhum registro encontrado"), feedback ao aplicar filtros.
- **Export**: CSV e PDF respeitando filtros ativos; a exportação gera linha em `admin_audit_log` com `rota`, `motivo`, `ip`, `user_id`.

## 3.3. Server Routes (HTTP público)

`src/routes/api/public/*` — usados para health-check e potenciais webhooks. Verificam assinatura quando aplicável.

## 3.4. Convenções

- Naming: ponto-separado (`segmento.subsegmento.tsx`), não pastas aninhadas.
- `$param` para parâmetros dinâmicos.
- `_authenticated` é layout pathless (não aparece na URL) com gate de sessão.
- Cada rota define `head()` com `title`, `description`, `og:title`, `og:description`.
