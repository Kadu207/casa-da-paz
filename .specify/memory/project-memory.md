# Memória Viva — Casa da Paz

**Última atualização:** 2026-06-09

## Estado do projeto

| Item | Status |
|------|--------|
| Fase | Financeiro v2 + Dashboard v2 concluídos |
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
| 017-dashboard-v2 | ✅ Produção |
| 018-painel-medium | ✅ Implementado — deploy pendente |
| 016-frontend-nextjs | 📋 Bloqueado (ADR-008) |

## Módulos

| Módulo | Status | Notas |
|--------|--------|-------|
| Auth + RBAC | Concluído | JWT |
| Financeiro | v2 S3 prod | 4 abas: lançamentos, fluxo, atrasados, conciliação |
| Dashboard | v2 + painel MEDIUM | Filtro período; médium vê mensalidades/presenças/inscrições |
| Portal + LGPD | Concluído | v2026-06-09 |
| Next.js | Adiado | ADR-008 |

## Próximos passos

1. Deploy 017 + 018 (backend + frontend)
2. **Auditoria V2** ou **012 Chatwoot/N8N prod**
3. Epic 016 Next.js — aguardando aprovação (ADR-008)

Espelhamento Windows/Debian: posterior (`docs/memory/runbooks/dev-windows-linux-sync.md`).
