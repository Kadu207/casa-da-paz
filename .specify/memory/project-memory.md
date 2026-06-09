# Memória Viva — Casa da Paz

**Última atualização:** 2026-06-09

## Estado do projeto

| Item | Status |
|------|--------|
| Fase | Financeiro v2 S3 UI implementada; deploy frontend pendente |
| Versão | 0.1.0-alpha |
| Produção | https://casadapaz.inovatitech.com.br (VPS + Cloudflare) |
| GitHub/GitLab | `kadu207/casa-da-paz` — push dual |

## Cronograma

Ver **`docs/memory/roadmap-cronograma.md`**

| Fase | Status |
|------|--------|
| 003-financeiro-v2 S1 | ✅ Produção |
| 003-financeiro-v2 S2 | ✅ Produção |
| 003-financeiro-v2 S3 | 🔄 UI Vite (4 abas) — commit `75591c6`; prod assets OK; smoke manual pendente |
| 016-frontend-nextjs | 📋 Spec only — **após S3 + gates** (ADR-008) |

## Módulos

| Módulo | Status | Notas |
|--------|--------|-------|
| Auth + RBAC | Concluído | JWT |
| Financeiro | v2 S3 UI | 4 abas: lançamentos, fluxo, atrasados, conciliação |
| Portal + LGPD | Concluído | v2026-06-09 |
| Next.js | Adiado | ADR-008 |

## Próximos passos

1. Deploy frontend S3 → VPS smoke (4 abas financeiro)
2. Gates S3.6 (validador-integracao + validador-qualidade)
3. Epic 016 Next.js — só após S3 em produção + aprovação usuário (ADR-008)
