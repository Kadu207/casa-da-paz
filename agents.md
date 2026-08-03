# Agents — Casa da Paz

Entrada canônica de orquestração de agentes (**`agents.md`**).  
Memória: [`.specify/memory/memory.md`](.specify/memory/memory.md)

## Orquestração padrão

```
Usuário → agent-orquestrador → agente-domínio → validador-integracao → validador-qualidade → atualizar memória
```

## Índice de skills (`.cursor/skills/`)

| Skill | Quando usar |
|-------|-------------|
| [`agent-orquestrador`](.cursor/skills/agent-orquestrador/SKILL.md) | Qualquer tarefa — roteia automaticamente |
| [`agent-arquitetura-seguranca`](.cursor/skills/agent-arquitetura-seguranca/SKILL.md) | RBAC, JWT, policies, auditoria, Asaas secrets |
| [`agent-backend-api`](.cursor/skills/agent-backend-api/SKILL.md) | Express, Prisma, rotas, webhooks Asaas/N8N |
| [`agent-frontend-ux`](.cursor/skills/agent-frontend-ux/SKILL.md) | React, Tailwind, ERP, portal, marketing |
| [`agent-dados-ia`](.cursor/skills/agent-dados-ia/SKILL.md) | Schema, migrations, Excel, Python IA |
| [`agent-infra-devops`](.cursor/skills/agent-infra-devops/SKILL.md) | Docker, Nginx, CI/CD, Cloudflare |
| [`validador-integracao`](.cursor/skills/validador-integracao/SKILL.md) | Coerência API ↔ FE ↔ DB ↔ RBAC |
| [`validador-qualidade`](.cursor/skills/validador-qualidade/SKILL.md) | Constitution, testes, gate release |

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

## Memória (ponteiros)

| Arquivo | Função |
|---------|--------|
| [`.specify/memory/memory.md`](.specify/memory/memory.md) | Índice vivo |
| [`.specify/memory/project-memory.md`](.specify/memory/project-memory.md) | Estado atual |
| [`.specify/memory/constitution.md`](.specify/memory/constitution.md) | Princípios imutáveis |

## Feature ativa

`specs/021-financeiro-asaas-gestor/` — gestor financeiro + Asaas + marketing

## Comandos sugeridos

- `@agent-orquestrador adicionar filtro doações no dashboard`
- `@agent-arquitetura-seguranca auditar RBAC`
- `@agent-dados-ia validar importação planilha`
- `@agent-backend-api integrar webhook Asaas`
- `@validador-qualidade revisar antes de release`

## Gate deploy VPS

**Nunca** executar `infra/scripts/deploy.sh` sem confirmação explícita do usuário.  
**Nunca** colocar `ASAAS_API_KEY` de produção sem confirmação — sandbox é o padrão.
