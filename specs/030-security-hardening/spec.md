# Feature 030 — Security hardening (app + VPS) + gates de qualidade

**Status:** ✅ Concluído  
**Data:** 2026-08-20  
**Agente:** `agent-security-ops`

## Objetivo

Fechar superfície de ataque (origin `:9080`, headers/CSP, uploads, rate-limit API), ativar gates (CodeRabbit config, Spec Kit mínimo, CI GitLab tests) e formalizar validadores.

## Acceptance

- [x] Skill `agent-security-ops` + roteamento no orquestrador
- [x] Checklists dos skills datados
- [x] V1/V2 formal em 028 e 029 (`tasks.md`)
- [x] CodeRabbit: `.coderabbit.yaml` no Git + espelho `docs/coderabbit.yaml` (Windows pode não checkout o dotfile)
- [x] Spec Kit: `spec.md` + `plan.md` + `tasks.md`
- [x] GitLab CI com `npm test`
- [x] Headers nginx + Helmet/CSP API
- [x] Upload MIME + magic bytes + testes
- [x] Rate-limit global `/api/`
- [x] Firewall `:9080` na VPS + smoke bypass (TIMEOUT de fora; HTTPS 200)
- [x] Inventário portas + script `check-prod-secrets.sh`
- [x] `npm audit --omit=dev` BE/FE: 0 vulnerabilidades

## Smoke 2026-08-20

```text
.\infra\scripts\smoke-security-origin.ps1
→ 7 ok, 0 fail (health+headers; IP:9080 inacessível)
```

## Fora

- JWT httpOnly cookie
- Pentest externo pago
- Asaas produção
