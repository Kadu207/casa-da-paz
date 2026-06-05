# Memória Viva — Casa da Paz

**Última atualização:** 2026-06-05

## Estado do projeto

| Item | Status |
|------|--------|
| Fase | Build — Epic 1 em andamento |
| Versão | 0.1.0-alpha |
| Produção | Não deployado |
| DNS | `casadapaz.inovatitech.com.br` (pendente VPS) |

## Módulos

| Módulo | Status | Notas |
|--------|--------|-------|
| Auth + RBAC | Em build | JWT, CRUD usuários |
| Pessoas | Em build | CRUD + deduplicação |
| Financeiro | Planejado | ADR-003 adimplência |
| Recepção/Check-in | Planejado | — |
| Eventos/Presenças | Planejado | + inscrições ADR-004 |
| Livraria/PDV | Planejado | + estoque |
| Portal público | Planejado | Sprint 3 ADR-005 |
| Chatwoot + N8N | Planejado | Sprint 3 ADR-006 |
| Dashboards | Planejado | Recharts |
| Import Excel + IA | Planejado | Python service |
| PIX webhook | Stub | — |

## Repositórios

- GitHub: `https://github.com/kadu207/casa-da-paz`
- GitLab: `https://gitlab.com/kadu207/casa-da-paz`

## Bloqueios

- Deploy VPS: aguardando confirmação do usuário
- Chatwoot WhatsApp Business: requer conta Meta Business (configurar em produção)

## Próximos passos

1. Concluir Epic 1 (auth, pessoas, infra)
2. Epic 2 módulos operacionais
3. Sprint 3 portal + Chatwoot/N8N
4. CI/CD dual push
5. Preparar deploy → acionar usuário
