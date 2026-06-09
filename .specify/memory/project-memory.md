# Memória Viva — Casa da Paz

**Última atualização:** 2026-06-09

## Estado do projeto

| Item | Status |
|------|--------|
| Fase | Financeiro v2 backend em produção; UI S3 pendente |
| Versão | 0.1.0-alpha |
| Produção | https://casadapaz.inovatitech.com.br (VPS + Cloudflare) |
| GitHub/GitLab | `kadu207/casa-da-paz` — push dual |

## Cronograma

Ver **`docs/memory/roadmap-cronograma.md`**

| Fase | Status |
|------|--------|
| 003-financeiro-v2 S1 | ✅ Produção |
| 003-financeiro-v2 S2 | 🔄 Backend (conciliação, export, métricas) |
| 003-financeiro-v2 S3 | ⏸ UI Vite — após S2 |
| 016-frontend-nextjs | 📋 Spec only — **após S3** (ADR-008) |

## Módulos

| Módulo | Status | Notas |
|--------|--------|-------|
| Auth + RBAC | Concluído | JWT |
| Financeiro | v2 S1 prod | fluxo-caixa, listagem, batch |
| Portal + LGPD | Concluído | v2026-06-09 |
| Next.js | Adiado | ADR-008 |

## Próximos passos

1. Deploy S2 backend → VPS smoke
2. Sprint 3 UI financeiro (Vite) — quando priorizado
3. Epic 016 Next.js — só após S3 + aprovação usuário
