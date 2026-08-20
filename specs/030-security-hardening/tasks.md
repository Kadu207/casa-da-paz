# Tasks — 030 Security hardening

## Implementação
- [x] agent-security-ops + agents.md
- [x] Checklists skills
- [x] Validators 028/029
- [x] CodeRabbit (Git `.coderabbit.yaml` + `docs/coderabbit.yaml`) + Spec Kit plan/tasks
- [x] GitLab test job
- [x] nginx headers / Helmet CSP API / upload MIME+magic / apiLimiter
- [x] VPS harden-origin-9080.sh + smoke-security-origin + check-prod-secrets
- [x] Smoke headers/health + bypass `:9080` (2026-08-20)

## Validador Integração (V1) — 2026-08-20
| Item | OK | Evidência |
|------|----|-----------|
| Headers API (Helmet) | sim | `backend/src/index.ts` |
| Upload MIME + magic | sim | `upload-filters.ts` + rotas media/ofx/import |
| Nginx CSP | sim | `prod-internal.conf`; smoke público |
| CI GL/GH test | sim | `.gitlab-ci.yml` / `ci.yml` |
| Firewall 9080 | sim | smoke IP:9080 TIMEOUT; runbook inventário |

## Validador Qualidade (V2) — 2026-08-20
| Item | OK | Evidência |
|------|----|-----------|
| Testes | sim | BE Vitest 121+; FE rbac-grant |
| npm audit | sim | 0 vulns omit=dev (override deepmerge-ts) |
| Spec 030 | sim | spec + plan + tasks |
| Memory | sim | project-memory + CHANGELOG |

**Resultado:** APROVADO V1+V2

### Reaplicar firewall (se reboot sem persistent)
```bash
cd ~/casadapaz/infra && sudo ./scripts/harden-origin-9080.sh
# ou via Docker privilegiado — ver docs/memory/runbooks/firewall-host-iptables.md
```
