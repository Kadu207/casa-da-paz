# Plan — 030 Security hardening (app + VPS) + gates

**Data:** 2026-08-20  
**Agente:** `agent-security-ops` + `agent-infra-devops` + `agent-backend-api`

## Abordagem

1. **Fase 0 (VPS):** filtrar `:9080`, headers nginx, inventário portas/secrets, smoke bypass CF  
2. **Fase 1 (App):** Helmet/CSP API, magic bytes upload, rate-limit `/api`, audit deps, testes  
3. **Fase 2 (Gates):** CodeRabbit, CI GitLab=`npm test`, validators 028/029, memory

## Decisões

| Tema | Escolha |
|------|---------|
| Origin bind | `0.0.0.0:9080` (tunnel Docker) + `harden-origin-9080.sh` |
| Headers FE | nginx `prod-internal.conf` / `prod.conf` |
| Headers API | `helmet` + Permissions-Policy |
| Uploads | MIME + extensão + magic bytes |
| CodeRabbit | `.coderabbit.yaml` no Git (Windows checkout pode falhar; espelho `docs/coderabbit.yaml`) |
| Audit prisma | `overrides.deepmerge-ts` ≥8 |

## Fora de escopo

JWT httpOnly, pentest pago, Asaas produção.
