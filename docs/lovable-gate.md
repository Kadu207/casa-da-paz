# Gate Lovable — Casa da Paz

**Status:** 🟢 Portal Lovable integrado em `frontend/src/pages/public/`

## O que foi integrado

- UI Lovable (Home, Eventos, Agendar, Contato) via React Router `/public/*`
- API Express existente (`/api/public/*`) — sem Supabase/TanStack Start
- Campo `protocolo` na resposta de agendamento (compatível com UI Lovable)
- Imagens: placeholders em `frontend/public/portal/` — substituir com `scripts/sync-lovable-portal-images.ps1`

## Checklist funcional (Sprint 3)

| Item | Status |
|------|--------|
| Portal `/public/*` conectado à API | ✅ |
| Agendamento → fila recepção | ✅ |
| Confirmar/cancelar + vincular Pessoa | ✅ |
| N8N outbound (novo/confirmado/cancelado) | ✅ stub |
| Chatwoot widget produção | ⏳ pendente token Meta |

## Quando ir para Lovable

✅ **Pode começar agora** o módulo **Portal público** (Home, Eventos, Agendar, Contato) — fluxo funcional validado.

Ordem sugerida na Lovable:
1. `/public` — Home + navegação
2. `/public/agendar` — formulário (referência: `PublicAgendar.tsx`)
3. `/public/eventos` — cards de eventos
4. `/public/contato` — WhatsApp + placeholder Chatwoot

Depois (opcional): Login + Dashboard para polish interno.

## Documento completo

Ver **[lovable-briefing-portal.md](./lovable-briefing-portal.md)** — copie para o chat Lovable.

## Design tokens

- Navy: `#0F172A`
- Gold: `#D4AF37`
- Ver `frontend/src/styles/tokens.css`

## Fluxo export
1. Prototipar no Lovable
2. Export → branch `lovable/export-portal`
3. Refatorar em `frontend/src/pages/public/` no Cursor
4. Manter `src/lib/api.ts` — sem mocks
