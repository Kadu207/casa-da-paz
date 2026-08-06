# Casa da Paz — Documentação Completa

ERP/CRM + portal público do terreiro de Umbanda afroindígena **Casa da Paz** (Conselheiro Lafaiete, MG).

**Produção:** https://casadapaz.inovatitech.com.br  
**Repos:** `kadu207/casa-da-paz` (GitHub + GitLab)  
**Orquestração:** [`agents.md`](../agents.md) · **Memória:** [`.specify/memory/memory.md`](../.specify/memory/memory.md)

## Sumário (documentação viva)

| # | Documento | Conteúdo |
|---|-----------|----------|
| 1 | [Visão Geral](./01-visao-geral.md) | Propósito, stack, escopo |
| 2 | [Arquitetura](./02-arquitetura.md) | Monorepo, camadas, integrações |
| 3 | [Rotas](./03-rotas.md) | Portal `/public/*` e ERP `/app/*` |
| 4 | [Banco de Dados](./04-banco-de-dados.md) | Prisma / PostgreSQL |
| 5 | [Auth e Segurança](./05-auth-seguranca.md) | JWT, RBAC, policies |
| 6 | [Design System](./06-design-system.md) | Tokens e UI |
| 7 | [Funcionalidades](./07-funcionalidades.md) | Módulos entregues |
| 8 | [Desenvolvimento](./08-desenvolvimento.md) | Local, scripts, testes |
| 9 | [Histórico e Roadmap](./09-roadmap-historico.md) | Entregas e próximos passos |

## Contratos e operação

| Documento | Função |
|-----------|--------|
| [Requisitos consolidados](./analise-requisitos-consolidada.md) | Escopo de negócio |
| [RBAC matrix](./contracts/rbac-matrix.md) | Matriz de permissões |
| [OpenAPI](./contracts/openapi.yaml) | Contrato HTTP (parcial) |
| [CHANGELOG](./memory/CHANGELOG.md) | Histórico de mudanças |
| [Roadmap operacional](./memory/roadmap-cronograma.md) | Prioridades atuais |
| [ADRs](./memory/decisions/) | Decisões arquiteturais |
| [Runbooks](./memory/runbooks/) | Deploy, import, LGPD, messaging |
| [Playbooks](./memory/playbooks/) | Operação por domínio |
| [Agentes Cursor](./11-agentes-e-operacao-cursor.md) | Skills e fluxo SDD |

## Referência histórica (Lovable)

Material legado do protótipo Lovable/Supabase (não é a stack de produção):

- [`docs/reference/lovable/`](./reference/lovable/00-index.md)

---

**Stack canônica:** React/Vite/TS + Express/Prisma/PostgreSQL + Python IA + Chatwoot/N8N + Docker/Nginx/Hetzner/Cloudflare  

**Endereço físico:** Rua Valério Eugênio, 570 — Bairro Areal — Conselheiro Lafaiete - MG
