# Memória Viva — Casa da Paz

**Última atualização:** 2026-08-02

## Estado do projeto

| Item | Status |
|------|--------|
| Fase | **021 Financeiro Asaas + Marketing** (implementado local) |
| Versão | 0.1.0-alpha |
| Produção | https://casadapaz.inovatitech.com.br (VPS + Cloudflare) |
| GitHub/GitLab | `kadu207/casa-da-paz` — push dual |

## Cronograma

Ver **`docs/memory/roadmap-cronograma.md`**

| Fase | Status |
|------|--------|
| 003-financeiro-v2 S1–S3 | ✅ Produção |
| **021-financeiro-asaas-gestor** | ✅ Código local — migration + Asaas sandbox + MARKETING + transparência interna |
| 017-dashboard-v2 | ✅ Smoke API local |
| 018-painel-medium | ✅ Smoke API local |
| 019-auditoria-v2 | ✅ Smoke API local |
| **012-chatwoot-n8n** | 🔄 Widget no ar — falta T8 (Meta WhatsApp) + T10 prod |
| **014-alertas-ui** | ✅ S1–S3 local — S4 deploy VPS pendente |
| **020-rbac-hierarquia** | ✅ V1 + MARKETING + resources 021 |
| 016-frontend-nextjs | 📋 Bloqueado (ADR-008) |

## Módulos

| Módulo | Status | Notas |
|--------|--------|-------|
| Auth + RBAC | Concluído | JWT + MARKETING + policies JSON |
| Financeiro | v2 + 021 | Contas, cobranças Asaas, transparência interna, assinaturas |
| Asaas PSP | Sandbox | ADR-009 — substitui Stripe; prod só com confirmação |
| Marketing | Novo | `/app/marketing` — publicar eventos/livros |
| Dashboard | v2 + painel MEDIUM | |
| Portal + LGPD | Concluído | Checkout livraria → Asaas invoiceUrl |
| Alertas UI | S1–S3 local | |
| Auditoria | v2 export | |

## Harness

- `agents.md` (entrada de orquestração)
- `.specify/memory/memory.md` + `project-memory.md`
- Skills em `.cursor/skills/`

## Próximos passos

1. **VPS deploy 021** — código em `main` (`c5001d8`); SSH local do agente sem chave — executar na máquina do usuário (ver runbook)
2. Configurar `ASAAS_API_KEY` sandbox (local + VPS); **não** usar chave produção até fornecida
3. **012 T8** — Meta WhatsApp no Chatwoot (gate humano)
4. Smoke pós-deploy: `https://casadapaz.inovatitech.com.br/health`

Espelhamento Windows/Debian: posterior (`docs/memory/runbooks/dev-windows-linux-sync.md`).
