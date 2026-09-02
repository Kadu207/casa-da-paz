# 5. Autenticação e Segurança

## 5.1. Autenticação

- Login: `POST /api/auth/login` com `login` + `senha` (não e-mail)
- Token: JWT Bearer (payload: `userId`, `pessoaId`, `setorAcesso`, `login`)
- Sessão no cliente: `localStorage` (`token`)
- Alteração de senha: `PUT /api/auth/me/senha`
- Contas seed/reset: `Usuario.deveTrocarSenha` bloqueia API até troca (código `MUST_CHANGE_PASSWORD`)

Seed padrão local/prod inicial: `admin` / `admin123` — **trocar imediatamente** em produção (F06 remediado).

## 5.2. Autorização (RBAC backend-first)

1. Middleware `authenticate` valida JWT  
2. `authorize(resource, action)` consulta grants efetivos  
3. Frontend só esconde UI (`hasPermission`) — **nunca** é a única barreira  

Matriz canônica: [`docs/contracts/rbac-matrix.md`](./contracts/rbac-matrix.md)  
Implementação: `backend/src/policies/rbac.ts`

### Papéis

| Papel | Escopo |
|-------|--------|
| SUPERVISOR | Master operacional (usuários + policies); não write em integrações |
| ADMIN | Integrações (webhooks, N8N), logs; também `estoque_casa` + `delegacoes` write |
| Operacionais | DIRETORIA, FINANCEIRO, **TESOURARIA**, MARKETING, RECEPCAO, LIVRARIA, MEDIUM, SUPORTE |

### Estoque da casa (`estoque_casa`)

- Write default: SUPERVISOR, ADMIN, DIRETORIA, TESOURARIA  
- MEDIUM: via override de policy **ou** como `GrupoLimpeza.responsavelUsuarioId` (read + checklist do próprio grupo; **não** write org-wide — F03)  
- Separado do resource `estoque` (livraria/PDV) — ADR-010  

### Delegações (`delegacoes`)

- Read: setores operacionais (+ MEDIUM) — todos veem todas as funções/tarefas  
- Write (CRUD função/tarefa/responsáveis): SUPERVISOR, ADMIN, DIRETORIA (+ policy)  
- Toggle check: qualquer um com `read`  
- ADR-011  

### Policies no cadastro (obrigatório operacional)

No **ato do cadastro** (`POST /api/auth/usuarios`):

1. SUPERVISOR escolhe setor + ajusta grants na UI  
2. Backend cria `Usuario` **e** `UsuarioPolicy` na mesma transação  
3. Grants = snapshot do padrão do setor + overrides (`snapshotGrantsForSetor`)  

Edição posterior: `GET/PUT /api/auth/usuarios/:id/politicas`  
Catálogo: `GET /api/auth/politicas/catalogo`

Usuários antigos sem policy continuam com defaults do setor até o SUPERVISOR salvar policies.

### Isolamento MEDIUM

Médiuns só enxergam dados financeiros ligados ao próprio `pessoa_id` (`financeiro:own`).  
`?pessoaId=` **não** sobrescreve escopo own (F01/F02 remediados).

## 5.3. Webhooks e secrets

- Webhooks N8N / Asaas: validação de secret/token  
- `resolveSecret` + denylist (`dev-secret`, `n8n-dev-secret`, …) — F04/F05/F10  
- Secrets **nunca** no repositório (`.env.production` só na VPS)  
- Gate VPS: `infra/scripts/check-prod-secrets.sh`  
- Asaas produção exige chave + confirmação explícita  

## 5.4. Headers / CSP

- API: Helmet CSP estrito  
- Frontend nginx: CSP com `frame-src` OpenStreetMap (mapa portal)  
- `X-Frame-Options: DENY`, nosniff  

## 5.5. Auditoria de segurança (F01–F10)

Status: **GREEN — Remediado / Validado** (2026-09-02).  
Detalhe: [`docs/security-audit/ACHADOS.md`](./security-audit/ACHADOS.md)  
Smoke: `scripts/smoke-audit-f01-f10-prod.ps1`

## 5.6. Auditoria ERP e LGPD

- Auditoria ERP com filtros e export CSV/PDF  
- Portal: consentimentos, termos, DSAR — ver `docs/contracts/lgpd-checklist.md` e runbook `dsar-lgpd.md`  

## 5.7. Spec

`specs/020-rbac-hierarquia-policies/spec.md` · ADR-002 · Spec 030 · ADR-011
