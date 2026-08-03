# Agentes — Casa da Paz

Espelho PT: [`docs/agentes.md`](docs/agentes.md) (e `agentes.md` na raiz, se existir) · Memória: [`.specify/memory/memory.md`](.specify/memory/memory.md)

## Orquestração padrão

```
Usuário → agent-orquestrador → agente-domínio → validador-integracao → validador-qualidade → atualizar memória
```

## Mapa de agentes

| Skill | Quando usar |
|-------|-------------|
| `agent-orquestrador` | Qualquer tarefa — roteia automaticamente |
| `agent-arquitetura-seguranca` | RBAC, JWT, policies, auditoria, secrets Asaas |
| `agent-backend-api` | Express, Prisma, rotas, webhooks Asaas/N8N/PIX |
| `agent-frontend-ux` | React, Tailwind, Lovable, portal, marketing, financeiro UI |
| `agent-dados-ia` | Schema, migrations, Excel, Python IA |
| `agent-infra-devops` | Docker, Nginx, CI/CD, Cloudflare |
| `validador-integracao` | Coerência API ↔ FE ↔ DB ↔ RBAC |
| `validador-qualidade` | Constitution, testes, gate release |

## Domínios da feature 021

| Domínio | Agente líder | Artefatos |
|---------|--------------|-----------|
| RBAC MARKETING + policies | arquitetura-seguranca | `rbac.ts`, `rbac-matrix.md` |
| Contas / Asaas / ledger | backend-api + dados-ia | `services/asaas/`, Prisma |
| UI financeiro + marketing | frontend-ux | `/app/financeiro/*`, `/app/marketing` |

## Memória obrigatória por tarefa

| Tipo | Ler antes | Atualizar depois |
|------|-----------|------------------|
| Feature nova | constitution, spec da feature, memory.md | project-memory, CHANGELOG |
| Bugfix | runbook se existir | project-memory |
| Deploy | runbook/deploy.md | project-memory — **acionar usuário** |
| Auditoria RBAC | rbac-matrix.md | ADR se mudança |
| PSP / Asaas | ADR-009 | playbook financeiro |

## Comandos sugeridos

- `@agent-orquestrador adicionar filtro doações no dashboard`
- `@agent-arquitetura-seguranca auditar RBAC`
- `@agent-dados-ia validar importação planilha`
- `@agent-backend-api integrar webhook Asaas`
- `@validador-qualidade revisar antes de release`

## Gate deploy VPS

**Nunca** executar `infra/scripts/deploy.sh` sem confirmação explícita do usuário.  
**Nunca** colocar `ASAAS_API_KEY` de produção sem confirmação — sandbox é o padrão.
