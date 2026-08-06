# 5. Autenticação e Segurança

## 5.1. Autenticação

- Login: `POST /api/auth/login` com `login` + `senha` (não e-mail)
- Token: JWT Bearer (payload: `userId`, `pessoaId`, `setorAcesso`, `login`)
- Sessão no cliente: `localStorage` (`token`)
- Alteração de senha: `PUT /api/auth/me/senha`

Seed padrão local/prod inicial: `admin` / `admin123` — **trocar imediatamente** em produção.

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
| ADMIN | Integrações (webhooks, N8N), logs |
| Operacionais | DIRETORIA, FINANCEIRO, MARKETING, RECEPCAO, LIVRARIA, MEDIUM, SUPORTE |

### Policies no cadastro (obrigatório operacional)

No **ato do cadastro** (`POST /api/auth/usuarios`):

1. SUPERVISOR escolhe setor + ajusta grants na UI  
2. Backend cria `Usuario` **e** `UsuarioPolicy` na mesma transação  
3. Grants = snapshot do padrão do setor + overrides (`snapshotGrantsForSetor`)  

Edição posterior: `GET/PUT /api/auth/usuarios/:id/politicas`  
Catálogo: `GET /api/auth/politicas/catalogo`

Usuários antigos sem policy continuam com defaults do setor até o SUPERVISOR salvar policies.

### Isolamento MEDIUM

Médiuns só enxergam dados ligados ao próprio `pessoa_id` (financeiro own, painel próprio).

## 5.3. Webhooks e secrets

- Webhooks N8N / Asaas: validação de secret/token  
- Secrets **nunca** no repositório (`.env.production` só na VPS)  
- Asaas produção exige chave + confirmação explícita  

## 5.4. Auditoria e LGPD

- Auditoria ERP com filtros e export CSV/PDF  
- Portal: consentimentos, termos, DSAR — ver `docs/contracts/lgpd-checklist.md` e runbook `dsar-lgpd.md`  

## 5.5. Spec

`specs/020-rbac-hierarquia-policies/spec.md` · ADR-002
