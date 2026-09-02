---
name: agent-security-ops
description: Segurança contínua pós-go-live Casa da Paz — OWASP light, VPS, secrets, headers, webhooks, auditoria.
---

# Agente Security Ops (pós-go-live)

## Quando usar
- Pós-deploy / release
- Suspeita de abuso, scrape, bypass Cloudflare
- Antes de ativar Asaas produção
- Auditoria periódica (mensal)

## Escopo
- App: JWT, CORS, CSP/Helmet, rate-limit, uploads, RBAC
- VPS: portas, firewall `:9080`, secrets `.env.production`
- Integrações: webhooks Asaas/PIX/N8N fail-closed
- Spec: `specs/030-security-hardening/`

## Checklist operacional (executar e datar)

### App
- [x] Login rate-limit ativo; usuário inativo não autentica — 2026-08-20
- [x] Produção: JWT_SECRET / CORS_ORIGIN sem default de dev — 2026-08-20 / revalidado 2026-09-02 (F04/F10)
- [x] Webhooks rejeitam token ausente/errado (timing-safe) — 2026-08-20
- [x] Headers: X-Frame-Options, nosniff, CSP (Helmet API + nginx FE) — 2026-08-20 / frame-src OSM 2026-09-02
- [x] Uploads com limite de tamanho + MIME + magic bytes — 2026-08-20
- [x] `npm audit` BE/FE sem critical/high abertos (ou waiver em ADR) — 2026-08-20
- [x] Auditoria F01–F10 remediada + smoke prod — 2026-09-02 (`ACHADOS.md` GREEN)

### VPS
- [x] `:9080` não acessível da internet pública (só loopback/Docker bridge + proxy) — 2026-08-20 smoke
- [x] Postgres sem bind público — 2026-08-20
- [x] Backend Casa da Paz sem publish de `:3000` no host — 2026-08-20
- [x] Inventário portas host documentado (Chatwoot/N8N compartilhados) — 2026-08-20
- [x] Health público `https://casadapaz.inovatitech.com.br/health` OK — 2026-08-20

### Processo
- [x] Validadores V1/V2 na feature recente (028/029/030) — 2026-08-20
- [x] CI GitHub + GitLab com `npm test` backend — 2026-08-20
- [x] Deploy só com confirmação (`CASADAPAZ_DEPLOY_CONFIRMED=yes`) — gate permanente
- [x] Atualizar `.specify/memory/project-memory.md` — 2026-08-20

## Gate
Bloquear ativação Asaas produção se checklist VPS+webhooks incompleto.

## Scripts
- `infra/scripts/harden-origin-9080.sh`
- `infra/scripts/smoke-security-origin.sh` / `.ps1`
- `infra/scripts/check-prod-secrets.sh`
