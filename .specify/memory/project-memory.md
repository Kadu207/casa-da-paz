# Memória Viva — Casa da Paz

**Última atualização:** 2026-06-09

## Estado do projeto

| Item | Status |
|------|--------|
| Fase | Financeiro v2 S3 concluído em produção |
| Versão | 0.1.0-alpha |
| Produção | https://casadapaz.inovatitech.com.br (VPS + Cloudflare) |
| GitHub/GitLab | `kadu207/casa-da-paz` — push dual |

## Cronograma

Ver **`docs/memory/roadmap-cronograma.md`**

| Fase | Status |
|------|--------|
| 003-financeiro-v2 S1 | ✅ Produção |
| 003-financeiro-v2 S2 | ✅ Produção |
| 003-financeiro-v2 S3 | ✅ Produção + smoke OK |
| 016-frontend-nextjs | 📋 Spec only — **após S3 + gates** (ADR-008) |

## Módulos

| Módulo | Status | Notas |
|--------|--------|-------|
| Auth + RBAC | Concluído | JWT |
| Financeiro | v2 S3 prod | 4 abas: lançamentos, fluxo, atrasados, conciliação |
| Portal + LGPD | Concluído | v2026-06-09 |
| Next.js | Adiado | ADR-008 |

## Próximos passos

1. Manter financeiro v2; evoluções sob demanda
2. Sync projetos Windows ↔ Debian: `docs/memory/runbooks/dev-windows-linux-sync.md`
3. Epic 016 Next.js — aguardando sua aprovação explícita (ADR-008)
