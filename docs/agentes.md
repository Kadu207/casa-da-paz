# Agentes — Casa da Paz (entrada PT)

Documento espelho de [`AGENTS.md`](../AGENTS.md). Use este arquivo ou `AGENTS.md` — o conteúdo canônico de orquestração está em ambos.

> Alias de raiz: se `agentes.md` na raiz estiver bloqueado pelo SO, este arquivo em `docs/` é a entrada PT oficial.

## Orquestração padrão

```
Usuário → agent-orquestrador → agente-domínio → validador-integracao → validador-qualidade → atualizar memória
```

## Índice de skills (`.cursor/skills/`)

| Skill | Quando usar |
|-------|-------------|
| [`agent-orquestrador`](../.cursor/skills/agent-orquestrador/SKILL.md) | Qualquer tarefa — roteia automaticamente |
| [`agent-arquitetura-seguranca`](../.cursor/skills/agent-arquitetura-seguranca/SKILL.md) | RBAC, JWT, policies, auditoria, Asaas secrets |
| [`agent-backend-api`](../.cursor/skills/agent-backend-api/SKILL.md) | Express, Prisma, rotas, webhooks Asaas/N8N |
| [`agent-frontend-ux`](../.cursor/skills/agent-frontend-ux/SKILL.md) | React, Tailwind, ERP, portal, marketing |
| [`agent-dados-ia`](../.cursor/skills/agent-dados-ia/SKILL.md) | Schema, migrations, Excel, Python IA |
| [`agent-infra-devops`](../.cursor/skills/agent-infra-devops/SKILL.md) | Docker, Nginx, CI/CD, Cloudflare |
| [`validador-integracao`](../.cursor/skills/validador-integracao/SKILL.md) | Coerência API ↔ FE ↔ DB ↔ RBAC |
| [`validador-qualidade`](../.cursor/skills/validador-qualidade/SKILL.md) | Constitution, testes, gate release |

## Memória

Índice vivo: [`.specify/memory/memory.md`](../.specify/memory/memory.md)  
Estado atual: [`.specify/memory/project-memory.md`](../.specify/memory/project-memory.md)  
Constituição: [`.specify/memory/constitution.md`](../.specify/memory/constitution.md)

## Feature ativa

`specs/021-financeiro-asaas-gestor/` — gestor financeiro + Asaas + marketing

## Gate deploy VPS

**Nunca** executar `infra/scripts/deploy.sh` sem confirmação explícita do usuário.  
Chaves Asaas de produção só após confirmação explícita (sandbox é o padrão).
