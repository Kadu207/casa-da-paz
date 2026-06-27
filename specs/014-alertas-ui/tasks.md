# Tasks — 014 Alertas UI + N8N

## S1 Backend

- [ ] `[R]` Testes: listagem paginada, filtros, RBAC (MEDIUM 403)
- [ ] `[G]` `GET /api/alertas` com query `tipo`, `disparado`, `de`, `ate`
- [ ] `[G]` `PATCH /api/alertas/:id` — marcar disparado
- [ ] `[G]` `POST /api/alertas/:id/reenviar` → `n8n.trigger('lembrete_atraso')`
- [ ] `[G]` Entrada na matriz RBAC `docs/contracts/rbac-matrix.md`

## S2 Frontend

- [ ] `[G]` `AlertasPage.tsx` — tabela + filtros
- [ ] `[G]` Rota `/app/alertas` + `RequireRole`
- [ ] `[G]` Badge pendências no menu (opcional S2.1)
- [ ] `[G]` i18n pt-BR + en

## S3 N8N + integração

- [ ] `[G]` Validar workflow `lembrete_atraso` aceita payload de reenvio
- [ ] `[ ]` Nó Chatwoot API no workflow (depende 012-T8 Meta)
- [ ] `[ ]` Smoke: sync-alertas → alerta na UI → reenviar → N8N 200

## S4 Gates

- [ ] `npm test` backend
- [ ] `npm run build` frontend
- [ ] Atualizar `project-memory.md` + CHANGELOG

## Ordem de execução

1. S1 backend (pode iniciar sem WhatsApp Meta)
2. S2 UI
3. S3 após **012-T8** (Meta token conectado)
4. S4 gates + deploy
