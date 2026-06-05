# Gap Analysis — Documentação Lovable vs Casa da Paz (repo)

**Data:** 2026-06-05  
**Referência:** docs em `docs/reference/lovable/` (export Lovable + docx convertido)

## Stacks (divergência principal)

| Aspecto | Lovable (doc) | Casa da Paz (repo) |
|---------|---------------|-------------------|
| Framework | TanStack Start v1 + SSR | Vite SPA + React Router |
| Backend | Supabase + RLS + serverFn | Express + Prisma + RBAC policies |
| Auth portal | Supabase email + Google OAuth | JWT interno (`/login`) — portal sem login |
| Auth admin | `/admin/*` + role `admin` | `/app/*` + `SetorAcesso` (DIRETORIA, etc.) |
| Deploy | Lovable Cloud / CF Workers | Docker + VPS Hetzner (planejado) |

## Portal público

| Item doc Lovable | Status Casa da Paz |
|------------------|-------------------|
| Home hero + galeria bento + mapa | ✅ Integrado (UI Lovable em `/public`) |
| `/eventos` filtros + banner | ✅ Parcial (sem detalhe `/eventos/:id` + .ics) |
| `/agendar` + protocolo | ✅ API Express + UI; Turnstile ❌ |
| `/acompanhar/:protocolo` | 🟡 Backend+rota nesta sprint |
| `/contato`, `/termos` | ✅ Contato; Termos ❌ |
| Turnstile captcha | ❌ (rate-limit Express OK) |
| Login Google OAuth (portal) | ❌ (só área interna JWT) |
| SafeImage + srcSet + preload | ✅ SafeImage; CF Images 🟡 helper |
| Imagens CDN Lovable | 🟡 Placeholders SVG — sync script existe |

## Admin / ERP (só no repo Casa da Paz)

| Módulo | Lovable doc | Casa da Paz |
|--------|-------------|-------------|
| Financeiro / adimplência | ❌ | ✅ |
| Recepção / check-in | ❌ | ✅ |
| Livraria PDV | ❌ | ✅ |
| Pessoas / dedup | ❌ | ✅ |
| N8N / Chatwoot | ❌ | ✅ dev |
| Import Excel + IA | ❌ | ✅ backend |

## Admin Lovable (não portado 1:1)

| Item | Status |
|------|--------|
| `/admin/auditoria` UI completa | 🟡 Tabela `admin_audit_log` + API i18n nesta sprint |
| CRUD eventos Lovable (slug, ordem, publicado) | Parcial — `EventosPage` interno diferente |
| Export CSV/PDF auditoria | ❌ V2 |
| Dashboard métricas eventos | 🟡 Nesta sprint (Recharts) |

## Roadmap doc §9 — implementação nesta sprint

| Item | Abordagem Casa da Paz |
|------|----------------------|
| i18n pt-BR / en visitantes | Context + JSON em `frontend/src/i18n/` |
| Dashboard métricas | `visualizacoes` + taxa inscrição no Dashboard |
| Newsletter + eventos | Tabela + POST público + UI footer/eventos |
| PWA | `vite-plugin-pwa` |
| i18n audit log | `audit-i18n.ts` rotas/motivos pt/en na API |
| CDN resize (CF Images) | `cfImageUrl()` + env `VITE_CF_IMAGES_*` |

## Mantido em paralelo (dois pipelines)

- **Lovable:** continua evoluindo UI/protótipo; export → refatorar em `frontend/src/pages/public/`
- **Casa da Paz:** API Express é fonte da verdade; nunca mockar Supabase em produção
