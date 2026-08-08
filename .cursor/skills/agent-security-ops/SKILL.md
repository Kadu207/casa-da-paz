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
- [ ] Login rate-limit ativo; usuário inativo não autentica
- [ ] Produção: JWT_SECRET / CORS_ORIGIN sem default de dev
- [ ] Webhooks rejeitam token ausente/errado (timing-safe)
- [ ] Headers: X-Frame-Options, nosniff, CSP (ou report-only)
- [ ] Uploads com limite de tamanho + MIME permitido
- [ ] `npm audit` BE/FE sem critical/high abertos (ou waiver em ADR)

### VPS
- [ ] `:9080` não acessível da internet pública (só loopback/Docker bridge + proxy)
- [ ] Postgres sem bind público
- [ ] Backend Casa da Paz sem publish de `:3000` no host
- [ ] Inventário portas host documentado (Chatwoot/N8N compartilhados)
- [ ] Health público `https://casadapaz.inovatitech.com.br/health` OK

### Processo
- [ ] Validadores V1/V2 na feature recente
- [ ] CI GitHub + GitLab com `npm test` backend
- [ ] Deploy só com confirmação (`CASADAPAZ_DEPLOY_CONFIRMED=yes`)
- [ ] Atualizar `.specify/memory/project-memory.md`

## Gate
Bloquear ativação Asaas produção se checklist VPS+webhooks incompleto.
