# Achados ? auditoria 2026-09-01 (pós-remediaç?o)

Ver `relatorio-auditoria-seguranca.pdf` (snapshot original) e `gerar_relatorio.py`.

**Status consolidado:** todos **GREEN ? Remediado / Validado** (2026-09-02).

## Stack

React/Vite/TS + Express/Prisma/PostgreSQL + Docker Compose/CI. Isolamento: JWT + RBAC + own/`pessoa_id` (n?o RLS).

## Matriz F01?F10

| ID | Sev. | Tema | Status | Evid?ncia |
|----|------|------|--------|-----------|
| F01 | Crítica | IDOR `buildListagemWhere` + `?pessoaId=` | **Remediado / Validado** | Código: scope own fixo. Prod smoke 2026-09-02: MEDIUM `?pessoaId=1` sem vazamento. Unit: `listagem-financeiro.test.ts` |
| F02 | Crítica | GET `/api/financeiro` vetor F01 | **Remediado / Validado** | Mesmo smoke + handler usa `buildListagemWhere` corrigido |
| F03 | Alta | Limpeza ? write org-wide estoque | **Remediado / Validado** | `limpezaBypass` só checklist. Prod: MEDIUM POST `/estoque-casa/itens` ? 403. Unit: `estoque-casa.test.ts` |
| F04 | Alta | JWT `dev-secret` fora denylist | **Remediado / Validado** | `runtime-env.ts` inclui `dev-secret`. VPS `check-prod-secrets.sh` **APROVADO** |
| F05 | Média | N8N fallback sem `resolveSecret` | **Remediado / Validado** | `n8n.ts` usa `resolveSecret`. VPS `N8N_WEBHOOK_SECRET` OK (len=64) |
| F06 | Média | Senhas seed conhecidas | **Remediado / Validado** | `deveTrocarSenha` + bloqueio API. Prod: login `medium123` ? `deveTrocarSenha=true` |
| F07 | Média | Sub-rotas financeiras sem RequireRole | **Remediado / Validado** | `RequireRole.tsx` mapeia contas_pagar, dre, ofx, etc. |
| F08 | Média | UI write marketing/ecommerce | **Remediado / Validado** | `hasPermission(..., 'write')` em Marketing/Ecommerce |
| F09 | Baixa | href/src sem allowlist | **Remediado / Validado** | `safe-url.ts` + testes vitest FE |
| F10 | Info | `check-prod-secrets` denylist | **Remediado / Validado** | `DEV_BAD` inclui `dev-secret`/`changeme`; VPS APROVADO |

## Detalhe original (arquivo:linha)

### F01 CRÍTICA ? listagem-financeiro.ts
Query `pessoaId` sobrescrevia escopo own. **Fix:** `scopedPessoaId` ? own nunca sobrescrito.

### F02 CRÍTICA ? financeiro.ts
GET `/` propagava query para `buildListagemWhere`. **Fix:** depende do F01.

### F03 ALTA ? estoque-casa.ts
Responsável limpeza recebia write org-wide. **Fix:** bypass só `checklist` com `grupoId`.

### F04 ALTA ? docker-compose / runtime-env
`dev-secret` fora da denylist. **Fix:** denylist + script VPS.

### F05 MÉDIA ? n8n.ts
Fallback `n8n-dev-secret` sem `resolveSecret`. **Fix:** `resolveSecret(...)`.

### F06 MÉDIA ? seed.ts
admin123 / supervisor123. **Fix:** `Usuario.deveTrocarSenha` + bloqueio até `PUT /auth/me/senha`.

### F07 MÉDIA ? App.tsx
Sub-rotas financeiras sem RequireRole. **Fix:** RequireRole por recurso.

### F08 MÉDIA ? Marketing / Ecommerce
UI write só com read. **Fix:** `hasPermission(..., write)`.

### F09 BAIXA ? invoiceUrl / imagemUrl
Sem allowlist. **Fix:** `frontend/src/lib/safe-url.ts`.

### F10 INFO ? check-prod-secrets.sh
Denylist incompleta. **Fix:** alinhado a F04.

## Smoke produç?o

Script: `scripts/smoke-audit-f01-f10-prod.ps1`

```powershell
cd "C:\Projetos DEV\Casa da Paz"
.\scripts\smoke-audit-f01-f10-prod.ps1
```

**Última execuç?o:** 2026-09-02 ? **PASS 11 / FAIL 0** (F01?F10 + F06b).  
Após o smoke, login `medium` foi restaurado para `medium123` com `deveTrocarSenha=true`.

## Unitários (local)

- Backend: `listagem-financeiro.test.ts`, `estoque-casa.test.ts` ? OK  
- Frontend: `safe-url.test.ts` ? OK  

## Pend?ncias fora do escopo desta auditoria

- SMTP / inbox WhatsApp Meta (mensageria 012/033)  
- Chatwoot público 502 (`casadapaz-chat`)  
- Asaas dormant  
