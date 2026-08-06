# 11 — Agentes e operação no Cursor

## Premissa

No Cursor, “multi-agente” = skills + regras + prompts roteados — não swarm autônomo nativo.

**Entrada canônica:** [`agents.md`](../agents.md)  
**Memória:** [`.specify/memory/memory.md`](../.specify/memory/memory.md)  
Stub legado: [`docs/agentes.md`](./agentes.md) → aponta para `agents.md`.

## Fluxo padrão

```
Usuário → agent-orquestrador → agente-domínio
        → validador-integracao → validador-qualidade
        → atualizar project-memory + CHANGELOG
```

## Agentes de construção

| Skill | Uso |
|-------|-----|
| `agent-orquestrador` | Roteamento |
| `agent-arquitetura-seguranca` | RBAC, JWT, policies |
| `agent-backend-api` | Express, Prisma, rotas, jobs |
| `agent-frontend-ux` | React ERP / portal |
| `agent-dados-ia` | Schema, migrations, Excel, IA |
| `agent-infra-devops` | Docker, CI/CD, Cloudflare |
| `validador-integracao` | API ↔ FE ↔ DB ↔ RBAC |
| `validador-qualidade` | Constitution, testes, gate release |

## Agentes de pós-construção / operação

| Skill | Uso |
|-------|-----|
| `agent-tesouraria-ops` | Contas a pagar, baixas, agenda |
| `agent-recorrencia-mensalidade` | Job mensalidades |
| `agent-conciliacao-bancaria` | OFX |
| `agent-alertas-financeiros` | Atrasados / vencendo → N8N |
| `agent-relatorios-dre` | DRE, orçamento, centros |

Skills em `.cursor/skills/<nome>/SKILL.md`.

## Gates

- Deploy VPS: confirmação explícita + `CASADAPAZ_DEPLOY_CONFIRMED=yes`  
- Asaas produção: chave + confirmação — tesouraria opera sem PSP  
- Spec antes de feature nova (`specs/<feature>/`)  

## Anti-padrões

- “Faça tudo” sem spec  
- Merge sem testes relevantes  
- Secrets no Git  
- Deploy VPS sem confirmação  
- Depender de Asaas para fluxos de tesouraria internos  
