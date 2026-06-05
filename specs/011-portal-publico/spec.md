# Feature 011 — Portal Público MVP (Sprint 3)

## Rotas
- /public — home institucional
- /public/eventos — eventos abertos
- /public/agendar — formulário agendamento
- /public/contato — WhatsApp + Chatwoot

## Acceptance
- [x] GET /api/public/eventos sem JWT
- [x] POST /api/public/agendamentos com rate limit + notify N8N
- [x] Páginas responsivas mobile-first
- [x] Fila recepção GET/PATCH `/api/agendamentos`
- [x] Confirmar agendamento vincula/cria Pessoa
- [ ] Chatwoot widget em produção (VITE_CHATWOOT_WEBSITE_TOKEN)

## Gate Lovable
Quando Chatwoot em prod estiver configurado OU aceitar stub, prototipar `/public/*` na Lovable.
