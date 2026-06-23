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
| 003-financeiro-v2 S1–S3 | ✅ Produção |
| 017-dashboard-v2 | ✅ Implementado — deploy pendente |
| 018-painel-medium | ✅ Implementado — deploy pendente |
| 019-auditoria-v2 | ✅ Implementado — deploy pendente |
| **012-chatwoot-n8n** | 🔄 Widget no ar no portal — falta WhatsApp/Meta + smoke N8N |
| 016-frontend-nextjs | 📋 Bloqueado (ADR-008) |

## Módulos

| Módulo | Status | Notas |
|--------|--------|-------|
| Auth + RBAC | Concluído | JWT |
| Financeiro | v2 S3 prod | 4 abas: lançamentos, fluxo, atrasados, conciliação |
| Dashboard | v2 + painel MEDIUM | Filtro período; médium vê mensalidades/presenças/inscrições |
| Portal + LGPD | Concluído | v2026-06-09 |
| Auditoria | v2 export | CSV/PDF + filtros |
| Next.js | Adiado | ADR-008 |

## Próximos passos

1. Deploy 017–019 (backend + frontend)
2. **012 Chatwoot/N8N prod** — runbook `docs/memory/runbooks/deploy-messaging-prod.md` (VPS + token Meta)
3. Epic 016 Next.js — aguardando aprovação (ADR-008)

Espelhamento Windows/Debian: posterior (`docs/memory/runbooks/dev-windows-linux-sync.md`).
