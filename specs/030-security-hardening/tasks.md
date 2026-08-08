# Tasks — 030 Security hardening

## Implementação
- [x] agent-security-ops + agents.md
- [x] Checklists skills
- [x] Validators 028/029
- [x] CodeRabbit docs + Spec Kit
- [x] GitLab test job
- [x] nginx headers / CSP API / upload filters / apiLimiter
- [ ] VPS harden-origin-9080.sh
- [ ] Deploy + smoke

## Validador Integração (V1) — 2026-08-08
| Item | OK | Evidência |
|------|----|-----------|
| Headers API | sim | `backend/src/index.ts` |
| Upload filters | sim | `upload-filters.ts` |
| Nginx CSP | sim | `prod-internal.conf` |
| CI GL test | sim | `.gitlab-ci.yml` |

## Validador Qualidade (V2) — 2026-08-08
| Item | OK | Evidência |
|------|----|-----------|
| Testes upload-filters | sim | vitest |
| Spec 030 | sim | este arquivo |
| Memory | pendente pós-deploy | |

**Resultado:** EM ANDAMENTO (aguarda VPS firewall + deploy)
