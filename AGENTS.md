# Agentes — Casa da Paz

## Orquestração padrão

```
Usuário → agent-orquestrador → agente-domínio → validador-integracao → validador-qualidade → atualizar memória
```

## Mapa de agentes

| Skill | Quando usar |
|-------|-------------|
| `agent-orquestrador` | Qualquer tarefa — roteia automaticamente |
| `agent-arquitetura-seguranca` | RBAC, JWT, policies, auditoria |
| `agent-backend-api` | Express, Prisma, rotas, webhooks |
| `agent-frontend-ux` | React, Tailwind, Lovable, portal público |
| `agent-dados-ia` | Schema, migrations, Excel, Python IA |
| `agent-infra-devops` | Docker, Nginx, CI/CD, Cloudflare |
| `validador-integracao` | Coerência API ↔ FE ↔ DB ↔ RBAC |
| `validador-qualidade` | Constitution, testes, gate release |

## Memória obrigatória por tarefa

| Tipo | Ler antes | Atualizar depois |
|------|-----------|------------------|
| Feature nova | constitution, spec da feature | project-memory, CHANGELOG |
| Bugfix | runbook se existir | project-memory |
| Deploy | runbook/deploy.md | project-memory — **acionar usuário** |
| Auditoria RBAC | rbac-matrix.md | ADR se mudança |

## Comandos sugeridos

- `@agent-orquestrador adicionar filtro doações no dashboard`
- `@agent-arquitetura-seguranca auditar RBAC`
- `@agent-dados-ia validar importação planilha`
- `@validador-qualidade revisar antes de release`

## Gate deploy VPS

**Nunca** executar `infra/scripts/deploy.sh` sem confirmação explícita do usuário.
