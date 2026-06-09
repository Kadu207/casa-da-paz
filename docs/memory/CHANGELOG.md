# Changelog — Casa da Paz

## [Unreleased]

### Adicionado
- **Financeiro v2 S3 (UI Vite):** 4 abas — Lançamentos, Fluxo de caixa, Atrasados, Conciliação
- Sub-nav `FinanceiroLayout`, rotas aninhadas em `/app/financeiro/*`
- i18n pt-BR/en para módulo financeiro; export CSV/PDF; batch pagar atrasados

### Removido
- `FinanceiroPage.tsx` legado (substituído pelas 4 telas)

## [0.1.0-alpha] — 2026-06-05

### Adicionado
- Documentação consolidada (MD + DOCX + PDF)
- 7 ADRs (Lovable, RBAC, adimplência, estoque, portal, Chatwoot/N8N, dual-git)
- Pipeline SDD: Spec Kit, memória permanente, 8 agentes Cursor
- Monorepo: frontend, backend, ai-service, infra
- Epic 1: auth-rbac, pessoas-core, infra-base
- Epic 2: financeiro ADR-003, recepção check-in, migrations Prisma formais
- Epic 2b: inscrições ADR-004, livraria PDV/estoque
- Portal público e WhatsApp no escopo MVP (Sprint 3)
- Repositórios GitHub e GitLab `kadu207/casa-da-paz`
