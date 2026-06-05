# Feature 011 — Portal Público MVP

## Rotas
- /public — home institucional
- /public/eventos — eventos abertos
- /public/agendar — formulário agendamento
- /public/contato — WhatsApp + Chatwoot

## Acceptance
- [x] GET /api/public/eventos sem JWT
- [x] POST /api/public/agendamentos com rate limit
- [x] Páginas responsivas mobile-first
- [ ] Chatwoot widget em produção (VITE_CHATWOOT_WEBSITE_TOKEN)
