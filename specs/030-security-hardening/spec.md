# Feature 030 — Security hardening (app + VPS) + gates de qualidade

**Status:** Em implementação  
**Data:** 2026-08-08  
**Agente:** `agent-security-ops`

## Objetivo

Fechar superfície de ataque (origin `:9080`, headers/CSP, uploads, rate-limit API), ativar gates (CodeRabbit config, Spec Kit mínimo, CI GitLab tests) e formalizar validadores.

## Acceptance

- [x] Skill `agent-security-ops` + roteamento no orquestrador
- [x] Checklists dos skills datados 2026-08-08
- [x] V1/V2 formal em 028 e 029 (`tasks.md`)
- [x] CodeRabbit config em `docs/coderabbit.yaml` (raiz `.coderabbit.yaml` bloqueada no Windows — copiar no GitHub/manual)
- [x] Spec Kit README + templates plan/tasks
- [x] GitLab CI com `npm test`
- [x] Headers nginx + CSP API
- [x] Upload MIME filters + testes
- [x] Rate-limit global `/api/`
- [x] Firewall `:9080` na VPS (script pronto; **sudo manual** — ver tasks)
- [x] Deploy + smoke segurança (headers públicos OK; health OK)

## Fora

- JWT httpOnly cookie
- Pentest externo pago
- Asaas produção
