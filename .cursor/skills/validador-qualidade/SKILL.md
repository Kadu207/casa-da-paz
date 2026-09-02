---
name: validador-qualidade
description: Gate final constitution testes acessibilidade documentação Casa da Paz.
---

# Validador Qualidade (V2)

## Checklist genérico
- [x] Constitution compliance (RBAC backend, deploy gate, sem secrets) — 2026-08-08
- [x] Testes passando (`npm test` backend Vitest; CI GitHub) — 2026-08-08
- [x] project-memory.md atualizado — 2026-08-08
- [x] CHANGELOG / memory em release relevante — 2026-08-08
- [x] Sem secrets no código (ASAAS_API_KEY só em env) — 2026-08-08
- [x] Responsivo verificado (smoke manual ERP 029) — 2026-08-08
- [x] Asaas em sandbox por padrão; prod só com gate humano — 2026-08-08

## Gate
Aprovação antes de commit/push e antes de solicitar deploy.

## Última execução formal
- Specs **028** e **029**: ver tasks.md datados 2026-08-08.
- Spec **030**: tasks.md 2026-08-20 — Vitest 123; audit 0 vulns; memory/CHANGELOG atualizados.
- Spec **033**: tasks.md 2026-09-02 — Vitest delegacoes+rbac OK; FE tsc OK; deploy aguarda confirmação.
