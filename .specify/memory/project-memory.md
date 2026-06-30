# Memória Viva — Casa da Paz

**Última atualização:** 2026-06-29

## Estado do projeto

| Item | Status |
|------|--------|
| Fase | Financeiro v2 + Dashboard v2 + Cadastros por função |
| Versão | 0.1.0-alpha |
| Produção | https://casadapaz.inovatitech.com.br (VPS + Cloudflare) |
| GitHub/GitLab | `kadu207/casa-da-paz` — push dual |

## Cronograma

Ver **`docs/memory/roadmap-cronograma.md`**

| Fase | Status |
|------|--------|
| 003-financeiro-v2 S1–S3 | ✅ Produção |
| 017-dashboard-v2 | ✅ Smoke API local (`scripts/test-dashboard-v2.ps1`) |
| 018-painel-medium | ✅ Smoke API local (`scripts/test-painel-medium.ps1`) |
| 019-auditoria-v2 | ✅ Smoke API local (`scripts/test-portal-auditoria.ps1`) |
| **012-chatwoot-n8n** | 🔄 Widget no ar — falta T8 (Meta WhatsApp) + T10 prod (login real) |
| **014-alertas-ui** | ✅ S1–S3 local — S4 deploy VPS pendente confirmação usuário |
| **020-rbac-hierarquia** | ✅ V1 implementada — SUPERVISOR + ADMIN + policies JSON |
| 016-frontend-nextjs | 📋 Bloqueado (ADR-008) |

## Módulos

| Módulo | Status | Notas |
|--------|--------|-------|
| Auth + RBAC | Concluído | JWT |
| Financeiro | v2 S3 prod | 4 abas: lançamentos, fluxo, atrasados, conciliação |
| Dashboard | v2 + painel MEDIUM | Filtro período; médium vê mensalidades/presenças/inscrições |
| Portal + LGPD | Concluído | Mapa Areal OK (OSM estático) — 2026-06-26 |
| Pessoas / Cadastros | Concluído | Seções por função; responsáveis legais menores |
| Alertas UI | S1–S3 local | `/app/financeiro/alertas`; N8N `lembrete_atraso`; WhatsApp após T8 |
| Auditoria | v2 export | CSV/PDF + filtros |
| Next.js | Adiado | ADR-008 |

## Próximos passos

1. **012 T8** — Meta WhatsApp no Chatwoot (gate humano)
2. **012 T10 prod** — `$env:CASADAPAZ_SENHA` real + `.\scripts\test-agendamento-n8n-prod.ps1` (raiz do repo)
3. **VPS (SSH)** — `cd ~/casadapaz && git pull origin main && cd infra && ./scripts/import-n8n-workflows.sh`
4. **014 S4 deploy** — confirmar com usuário antes de `deploy.sh`

Espelhamento Windows/Debian: posterior (`docs/memory/runbooks/dev-windows-linux-sync.md`).
