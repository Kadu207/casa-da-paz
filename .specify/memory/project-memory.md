# Memória Viva — Casa da Paz

**Última atualização:** 2026-06-26

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
| 017-dashboard-v2 | ✅ Produção (smoke API bloqueado — senha admin alterada) |
| 018-painel-medium | ✅ Deploy prod — validar login medium no browser |
| 019-auditoria-v2 | ✅ Deploy prod — validar export no browser |
| **012-chatwoot-n8n** | 🔄 Widget no ar — falta T8 (Meta) + T10 (smoke prod) |
| **014-alertas-ui** | 📋 Spec criada — S1/S2 podem iniciar; reenvio WhatsApp após T8 |
| **020-rbac-hierarquia** | ✅ V1 implementada — SUPERVISOR + ADMIN + policies JSON |
| 016-frontend-nextjs | 📋 Bloqueado (ADR-008) |

## Módulos

| Módulo | Status | Notas |
|--------|--------|-------|
| Auth + RBAC | Concluído | JWT |
| Financeiro | v2 S3 prod | 4 abas: lançamentos, fluxo, atrasados, conciliação |
| Dashboard | v2 + painel MEDIUM | Filtro período; médium vê mensalidades/presenças/inscrições |
| Portal + LGPD | Concluído | Mapa Areal OK (OSM estático) — 2026-06-26 |
| Auditoria | v2 export | CSV/PDF + filtros |
| Next.js | Adiado | ADR-008 |

## Próximos passos

1. **Recuperar VPS** — `compose-prod.sh up` + sync frontend do PC (build limpo `dist/`)
2. Deploy 017–019 smoke
3. **012 T8 + T10** — Meta WhatsApp + smoke N8N prod
4. **014 alertas-ui** — implementação S1/S2

Espelhamento Windows/Debian: posterior (`docs/memory/runbooks/dev-windows-linux-sync.md`).
