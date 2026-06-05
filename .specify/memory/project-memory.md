# Memória Viva — Casa da Paz

**Última atualização:** 2026-06-05

## Estado do projeto

| Item | Status |
|------|--------|
| Fase | Build concluído — MVP scaffold |
| Versão | 0.1.0-alpha |
| Produção | Não deployado |
| DNS | `casadapaz.inovatitech.com.br` (pendente VPS) |
| GitHub | https://github.com/Kadu207/casa-da-paz (push OK) |
| GitLab | https://gitlab.com/kadu207/casa-da-paz (criar + push — ver docs/gitlab-setup.md) |

## Módulos

| Módulo | Status | Notas |
|--------|--------|-------|
| Auth + RBAC | Concluído | JWT, CRUD usuários + UI |
| Pessoas | Concluído | CRUD + deduplicação fuzzy + PessoasPage |
| Financeiro | Concluído | ADR-003 adimplência derivada + UI |
| Recepção/Check-in | Concluído | Eventos + check-in completo |
| Eventos/Inscrições | Concluído | ADR-004 lotação + pagamento |
| Livraria/PDV | Concluído | PDV atômico + estoque |
| Portal público | Concluído | UI Lovable integrada + i18n + PWA |
| Chatwoot + N8N | Em build | Outbound N8N OK; widget prod pendente |
| Dashboards | Parcial | Métricas eventos + financeiro Recharts |
| Import Excel + IA | Planejado | Python service |
| PIX webhook | Stub | — |

## Repositórios

- GitHub: `https://github.com/kadu207/casa-da-paz`
- GitLab: `https://gitlab.com/kadu207/casa-da-paz`

## Bloqueios

- Deploy VPS: aguardando confirmação do usuário
- Chatwoot WhatsApp Business: requer conta Meta Business (configurar em produção)

## Próximos passos

1. Lovable — portal público (ver `docs/lovable-gate.md`)
2. Chatwoot widget produção + workflows N8N no Docker
3. Import Excel + IA
