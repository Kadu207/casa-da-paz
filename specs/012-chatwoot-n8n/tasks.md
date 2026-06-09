# Tasks 012 — Chatwoot/N8N prod

- [x] T1 — `docker-compose.prod.messaging.yml` + env example
- [x] T2 — Scripts `compose-prod-messaging.sh`, `init-chatwoot-prod.sh`, `import-n8n-workflows.sh`
- [x] T3 — Workflows JSON faltantes (lembrete, recibo, ingresso)
- [x] T4 — `ChatwootWidget` + integração `PublicLayout`
- [x] T5 — Scripts PC `build-frontend-prod.ps1`, `deploy-frontend-vps.ps1`
- [x] T6 — Runbook `docs/memory/runbooks/deploy-messaging-prod.md`
- [x] T7 — VPS: git pull + compose messaging + init (pgvector OK, HTTPS 200)
- [ ] T8 — Meta token + inbox WhatsApp no Chatwoot (usuário)
- [x] T9 — Rebuild frontend com `VITE_CHATWOOT_*` + sync (2026-06-09)
- [ ] T10 — Smoke `test-agendamento-n8n.ps1` em prod

## Produção (2026-06-09)

- Chatwoot público: `https://casadapaz-chat.inovatitech.com.br` (2º nível — Universal SSL não cobre 3º nível)
- Túnel Cloudflare: service `http://128.140.77.31:3001`
- DB: `pgvector/pgvector:pg16`, banco `chatwoot_db` com extensão `vector`
