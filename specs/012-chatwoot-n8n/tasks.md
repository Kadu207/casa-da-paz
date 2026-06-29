# Tasks 012 — Chatwoot/N8N prod

- [x] T1 — `docker-compose.prod.messaging.yml` + env example
- [x] T2 — Scripts `compose-prod-messaging.sh`, `init-chatwoot-prod.sh`, `import-n8n-workflows.sh`
- [x] T3 — Workflows JSON faltantes (lembrete, recibo, ingresso)
- [x] T4 — `ChatwootWidget` + integração `PublicLayout`
- [x] T5 — Scripts PC `build-frontend-prod.ps1`, `deploy-frontend-vps.ps1`
- [x] T6 — Runbook `docs/memory/runbooks/deploy-messaging-prod.md`
- [x] T7 — VPS: git pull + compose messaging + init (pgvector OK, HTTPS 200)
- [ ] T8 — Meta token + inbox WhatsApp no Chatwoot (usuário)
- [x] T9 — Rebuild frontend com `VITE_CHATWOOT_*` + sync — **bubble no ar** (2026-06-10)
- [ ] T10 — Smoke `test-agendamento-n8n.ps1` em prod

## T8 — Meta WhatsApp (gate humano)

Pré-requisitos: Chatwoot em `https://casadapaz-chat.inovatitech.com.br` (HTTP 302).

- [ ] Conta **Meta Business** com app WhatsApp Business API
- [ ] No Meta: Phone Number ID, WABA ID, **Permanent Access Token**
- [ ] Chatwoot → Settings → Inboxes → **Add Inbox → WhatsApp**
- [ ] Colar token Meta no painel Chatwoot (nunca no repositório)
- [ ] Enviar mensagem teste do inbox WhatsApp para um número real
- [ ] (Opcional) `CHATWOOT_API_TOKEN` em `infra/.env.production` para N8N enviar mensagens

## T10 — Smoke E2E produção

Pré-requisitos: stack base UP (`curl http://127.0.0.1:9080/health` → JSON ok), N8N rodando.

```bash
# Na VPS — health
curl -s http://127.0.0.1:9080/health
curl -s -o /dev/null -w "%{http_code}\n" https://casadapaz.inovatitech.com.br/health
```

```powershell
# No PC — ajustar $base para produção se necessário
$env:CASADAPAZ_API = "https://casadapaz.inovatitech.com.br/api"
# Login DIRETORIA, POST agendamento público, confirmar recepção, verificar N8N Executions
```

Checklist manual:

- [ ] Portal `/public/agendar` — formulário envia (Turnstile OK)
- [ ] Backend dispara `novo_agendamento` → N8N execution 200
- [ ] Recepção confirma agendamento → `agendamento_confirmado` no N8N
- [ ] Widget em `/public/contato` abre bubble Chatwoot
- [ ] (Após T8) Mensagem WhatsApp recebida no número de teste

Script local: `scripts/test-agendamento-n8n.ps1` (localhost). Prod: `scripts/test-agendamento-n8n-prod.ps1` (`$env:CASADAPAZ_API`).

## Produção (2026-06-10)

- Chatwoot público: `https://casadapaz-chat.inovatitech.com.br` (2º nível — Universal SSL não cobre 3º nível)
- Túnel Cloudflare: service `http://128.140.77.31:3001`
- DB: `pgvector/pgvector:pg16`, banco `chatwoot_db` com extensão `vector`
- Widget no portal: funcionando (inbox Website, token validado via `/widget?website_token=`)
- Turnstile: `VITE_TURNSTILE_SITE_KEY` obrigatória no build — sem ela newsletter/agendamento dão 403
- Atenção: servidor tem 2 Chatwoots — usar `casadapaz-chat.*`, NÃO `chat.inovatitech.com.br` (Inovati)
- Cache PWA: após deploy, bubble pode demorar a aparecer (service worker) — testar anônimo/Clear site data
