# Tasks — 014 Alertas UI + N8N

**Spec:** `spec.md` | **Ordem:** S1 → S2 → S3 (após 012-T8) → S4  
**Pode iniciar sem WhatsApp Meta:** S1 + S2 (reenvio N8N retorna 200 mesmo sem Chatwoot conectado)

---

## S1 — Backend API + RBAC

Referência de padrão: `backend/src/routes/auditoria.ts` (paginação, filtros Zod).

### S1.0 — Testes Red (antes do Green)

- [x] `[R]` Criar `backend/src/routes/alertas.test.ts` (vitest)
  - GET `/api/alertas` — DIRETORIA 200, MEDIUM 403
  - Filtros `tipo`, `disparado`, `de`, `ate` aplicados no `where`
  - PATCH `/api/alertas/:id` — `{ disparado: true }` persiste
  - POST `/api/alertas/:id/reenviar` — mock `dispararN8n`, retorna `{ enviado: true }` e marca `disparado`
  - 404 em id inexistente; 403 FINANCEIRO read-only se tentar write sem grant

### S1.1 — RBAC

- [x] `[G]` Adicionar `'alertas'` em `RBAC_RESOURCES` (`backend/src/policies/rbac.ts`)
- [x] `[G]` Grants default:
  - DIRETORIA, FINANCEIRO, SUPERVISOR → `write`
  - RECEPCAO, SUPORTE → `read` (V1.2 operacional futuro)
  - MEDIUM, LIVRARIA → sem entrada (403)
- [x] `[G]` Atualizar `docs/contracts/rbac-matrix.md` — linha **Alertas**
- [ ] `[G]` Espelhar recurso no frontend `hasPermission` se houver catálogo estático

### S1.2 — Rotas

- [x] `[G]` Criar `backend/src/routes/alertas.ts`
- [x] `[G]` Registrar em `backend/src/index.ts` → `app.use('/api/alertas', alertasRouter)`

**GET `/api/alertas`**

Query Zod: `page`, `limit` (max 100), `tipo`, `disparado` (boolean), `de`, `ate`, `sort` (`createdAt`|`tipo`), `order`.

Response:

```json
{ "page": 1, "limit": 25, "total": 42, "items": [{ "id", "tipo", "mensagem", "pessoaId", "pessoa": { "nomeCompleto", "telefone" }, "canal", "disparado", "createdAt" }] }
```

- Include `pessoa` quando `pessoaId` presente
- `authorize('alertas', 'read')`

**PATCH `/api/alertas/:id`**

Body: `{ disparado: true }` (Zod). `authorize('alertas', 'write')`.

**POST `/api/alertas/:id/reenviar`**

- Busca alerta + pessoa (telefone)
- `dispararN8n('lembrete_atraso', { alertaId, pessoaId, telefone, mensagem, tipo })`
- Se `enviado`: `disparado = true`
- Response: `{ enviado, motivo? }`
- `authorize('alertas', 'write')`

### S1.3 — Gates S1

- [x] `[G]` `npm run lint` + `npm test` backend passando
- [x] `[G]` `POST /api/financeiro/sync-alertas` continua criando alertas (sem regressão)

---

## S2 — Frontend UI

Referência de padrão: `frontend/src/pages/AuditoriaPage.tsx` (filtros + tabela paginada).

### S2.1 — Página e rota

- [x] `[G]` Criar `frontend/src/pages/AlertasPage.tsx`
- [x] `[G]` Rota `/app/financeiro/alertas` em `App.tsx` + `RequireRole`
- [x] `[G]` Tab em `FinanceiroLayout.tsx`

### S2.2 — i18n

- [x] `[G]` Chaves em `erp-pt-BR.ts` e `erp-en.ts`
- [x] `[G]` `erp.financeiro.tab.alertas`

### S2.3 — Badge pendências (S2.1 opcional)

- [x] `[G]` GET `/api/alertas?disparado=false&limit=1` → usar `total` no menu/tab
- [x] `[G]` Badge numérico se `total > 0` (FinanceiroLayout)

### S2.4 — Gates S2

- [x] `[G]` `npm run lint` + `npm run build` frontend
- [ ] `[G]` Smoke manual local:
  1. Login FINANCEIRO ou DIRETORIA
  2. Financeiro → Sync alertas (ou seed com atrasados)
  3. `/app/alertas` lista registros
  4. Marcar disparado / reenviar (N8N local opcional)

---

## S3 — N8N + integração prod (após 012-T8)

- [x] `[G]` Validar workflow `infra/n8n/workflows/lembrete-atraso.json` aceita payload de reenvio
- [x] `[G]` Nó Chatwoot API no workflow (desabilitado — ativar após **012-T8** Meta token)
- [x] `[G]` Script smoke local: `scripts/test-alertas-reenviar.ps1`
- [ ] `[ ]` Smoke prod: sync-alertas → UI → reenviar → N8N 200 → WhatsApp recebido

---

## S4 — Gates release

- [ ] `npm test` backend · `npm run build` frontend
- [ ] Atualizar `project-memory.md` + `docs/memory/CHANGELOG.md`
- [ ] Deploy VPS (confirmar com usuário)

---

## Ordem de execução recomendada

```
S1.0 testes Red → S1.1 RBAC → S1.2 rotas → S1.3 gates
    → S2.1 página → S2.2 i18n → S2.4 smoke local
    → (012-T8 Meta) → S3 → S4 deploy
```
