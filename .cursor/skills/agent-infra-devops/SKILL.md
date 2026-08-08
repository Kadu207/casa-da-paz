---
name: agent-infra-devops
description: Docker Compose Nginx CI/CD Cloudflare Hetzner dual-git Casa da Paz.
---

# Agente Infra e DevOps (A5)

## Escopo
- `infra/`
- `.github/workflows/`
- `.gitlab-ci.yml`

## Checklist
- [x] docker-compose local/prod funcional — 2026-08-08
- [x] Chatwoot + N8N no servidor compartilhado (inventário portas) — 2026-08-08
- [x] CI lint + test + build (GitHub; GitLab com test) — 2026-08-08
- [x] deploy.sh bloqueado sem `CASADAPAZ_DEPLOY_CONFIRMED=yes` — 2026-08-08
- [x] Cloudflare DNS documentado (`infra/cloudflare-dns.md`) — 2026-08-08

## Gate deploy
Preparar artefatos → **acionar usuário** para VPS.

## Relacionado
`agent-security-ops` — firewall `:9080`, headers, secrets pós-go-live.
