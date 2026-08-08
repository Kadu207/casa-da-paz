# Tasks — 030 Security hardening

## Implementação
- [x] agent-security-ops + agents.md
- [x] Checklists skills
- [x] Validators 028/029
- [x] CodeRabbit docs + Spec Kit
- [x] GitLab test job
- [x] nginx headers / CSP API / upload filters / apiLimiter
- [x] VPS harden-origin-9080.sh (no repo; **falta `sudo` do usuário na VPS**)
- [x] Deploy + smoke headers/health

## Validador Integração (V1) — 2026-08-08
| Item | OK | Evidência |
|------|----|-----------|
| Headers API | sim | `backend/src/index.ts` + prod `/api` |
| Upload filters | sim | `upload-filters.ts` |
| Nginx CSP | sim | público: CSP + X-Frame DENY |
| CI GL/GH test | sim | `.gitlab-ci.yml` / `ci.yml` |
| Firewall 9080 | pendente sudo | `infra/scripts/harden-origin-9080.sh` |

## Validador Qualidade (V2) — 2026-08-08
| Item | OK | Evidência |
|------|----|-----------|
| Testes | sim | BE 108 + FE 3 |
| npm audit | sim | 0 vulnerabilidades omit=dev |
| Spec 030 | sim | este arquivo |
| Memory | sim | project-memory |

**Resultado:** APROVADO com ressalva — executar na VPS:
```bash
cd ~/casadapaz/infra && sudo ./scripts/harden-origin-9080.sh
```
