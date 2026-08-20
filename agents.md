# Agents — Casa da Paz

Entrada canônica de orquestração (**`agents.md`**).  
Memória: [`.specify/memory/memory.md`](.specify/memory/memory.md)

## Orquestração padrão

```
Usuário → agent-orquestrador → agente-domínio → validador-integracao → validador-qualidade → atualizar memória
```

## A) Agentes de construção

| Skill | Quando usar |
|-------|-------------|
| [`agent-orquestrador`](.cursor/skills/agent-orquestrador/SKILL.md) | Qualquer tarefa — roteia |
| [`agent-arquitetura-seguranca`](.cursor/skills/agent-arquitetura-seguranca/SKILL.md) | RBAC, JWT, policies |
| [`agent-backend-api`](.cursor/skills/agent-backend-api/SKILL.md) | Express, Prisma, rotas, jobs |
| [`agent-frontend-ux`](.cursor/skills/agent-frontend-ux/SKILL.md) | React ERP / portal |
| [`agent-dados-ia`](.cursor/skills/agent-dados-ia/SKILL.md) | Schema, migrations, Excel, IA |
| [`agent-infra-devops`](.cursor/skills/agent-infra-devops/SKILL.md) | Docker, Nginx, CI/CD |
| [`validador-integracao`](.cursor/skills/validador-integracao/SKILL.md) | API ↔ FE ↔ DB ↔ RBAC |
| [`validador-qualidade`](.cursor/skills/validador-qualidade/SKILL.md) | Constitution, testes, gate |

## B) Agentes de pós-construção / operação

| Skill | Função operacional |
|-------|---------------------|
| [`agent-tesouraria-ops`](.cursor/skills/agent-tesouraria-ops/SKILL.md) | Contas a pagar, baixas, agenda, fechamento |
| [`agent-recorrencia-mensalidade`](.cursor/skills/agent-recorrencia-mensalidade/SKILL.md) | Job de mensalidades de médiuns |
| [`agent-conciliacao-bancaria`](.cursor/skills/agent-conciliacao-bancaria/SKILL.md) | Import OFX, matching |
| [`agent-alertas-financeiros`](.cursor/skills/agent-alertas-financeiros/SKILL.md) | Atrasados (receber) + vencendo (pagar) → N8N |
| [`agent-relatorios-dre`](.cursor/skills/agent-relatorios-dre/SKILL.md) | DRE, orçamento vs realizado, centros de custo |
| [`agent-security-ops`](.cursor/skills/agent-security-ops/SKILL.md) | Segurança contínua pós-go-live (OWASP light, VPS, secrets) |

## Features ativas

| Spec | Tema | Asaas |
|------|------|-------|
| 022–025 | Tesouraria completa | **Não depende** |
| 026 | Patrocínios / padrinhos | **Não depende** |
| 020 | Policies no cadastro de usuário | — |
| 021 | Asaas PSP | Dormant até `ASAAS_API_KEY` — [`asaas-dormant.md`](docs/memory/runbooks/asaas-dormant.md) |
| 031 | Estoque primário da casa | **Não depende** |
| 032 | Ingressos/eventos (secundário) | 📋 Planejado — não implementar ainda |

Docs: [`docs/00-index.md`](docs/00-index.md)

## Memória obrigatória

| Tipo | Ler antes | Atualizar depois |
|------|-----------|------------------|
| Feature | constitution, spec, memory.md | project-memory, CHANGELOG |
| Bugfix | runbook | project-memory |
| Deploy | runbook/deploy.md | **acionar usuário** |
| Ops tesouraria | playbook financeiro | project-memory se mudança |

## Gate deploy VPS

**Nunca** `deploy.sh` sem confirmação.  
**Nunca** Asaas produção sem chave e confirmação — tesouraria opera sem PSP.
