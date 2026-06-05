# ADR-005: Portal Público MVP

**Status:** Aceito | **Data:** 2026-06-05

## Contexto
PDF slide 3 prevê acesso público para agendamento e visualização de eventos.

## Decisão
Portal público no **mesmo frontend** (`/public/*`), sem autenticação:

| Rota | Função |
|------|--------|
| `/public` | Home institucional |
| `/public/eventos` | Lista eventos com status ABERTO |
| `/public/agendar` | Formulário agendamento consulta |
| `/public/contato` | WhatsApp (Chatwoot widget) + e-mail |

Backend:
- `GET /api/public/eventos` — sem JWT
- `POST /api/public/agendamentos` — rate limit 5/hora/IP
- Dados salvos em `AgendamentoPublico` → fila recepção

## Fora do MVP
- Login consulentes, pagamentos online, área logada pública

## Consequências
- Nginx serve `/public` como SPA
- CORS restrito ao domínio produção
- Sprint 3 dedicado (antes era fase 2 futura)
