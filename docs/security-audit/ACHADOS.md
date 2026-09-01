# Achados — auditoria 2026-09-01 (espelho do PDF)

Ver `relatorio-auditoria-seguranca.pdf` e `gerar_relatorio.py`.

## Stack
React/Vite/TS + Express/Prisma/PostgreSQL + Docker Compose/CI. Isolamento: JWT + RBAC + own/`pessoa_id` (não RLS).

## Achados (arquivo:linha)

### F01 CRÍTICA — listagem-financeiro.ts:105-110
`base.pessoaId` sobrescrito por query após spread do scope own.

### F02 CRÍTICA — financeiro.ts:130-138
GET `/` passa query + mediumScope para buildListagemWhere (vetor F01).

### F03 ALTA — estoque-casa.ts:68-84,109-110 (+ lib:5-15,27-28)
Responsável limpeza sem grupoId → write org-wide.

### F04 ALTA — docker-compose.yml:32 + runtime-env.ts:3-8
`dev-secret` fora de DEV_DEFAULTS.

### F05 MÉDIA — n8n.ts:28
Fallback `n8n-dev-secret` sem resolveSecret.

### F06 MÉDIA — seed.ts:95,104
admin123 / supervisor123.

### F07 MÉDIA — App.tsx:93-112
Sub-rotas financeiras sem RequireRole por recurso.

### F08 MÉDIA — Marketing/Ecommerce + RequireRole.tsx:28
UI write só com read.

### F09 BAIXA — invoiceUrl/imagemUrl
Sem allowlist de esquema.

### F10 INFO — check-prod-secrets.sh:13
Denylist incompleta (tema F04).

## P2/P3 � corrigidos 2026-09-01

| ID | Tema | Corre��o |
|----|------|----------|
| F06 | Senhas seed | `Usuario.deveTrocarSenha`; seed/create/reset; API bloqueia at� PUT /auth/me/senha; FE redireciona |
| F07 | Sub-rotas financeiras | RequireRole por recurso (pagamentos, contas-pagar, recorrencia, contribuintes, dre, ofx, contas) |
| F08 | Marketing/Ecommerce write | hasPermission write esconde formul�rios/a��es |
| F09 | URLs | safe-url.ts + SafeImage + invoiceUrl |

P1 permanece v�lido (IDOR, estoque limpeza, secrets).
