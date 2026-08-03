# Memória — índice vivo (Casa da Paz)

Ponto de entrada da memória do projeto. Atualizar `project-memory.md` ao encerrar cada tarefa.

## Núcleo Spec Kit

| Arquivo | Função |
|---------|--------|
| [constitution.md](constitution.md) | Princípios imutáveis |
| [project-memory.md](project-memory.md) | Estado atual, fases, próximos passos |
| [memory.md](memory.md) | Este índice |

## Agentes / Harness

| Arquivo | Função |
|---------|--------|
| [AGENTS.md](../../AGENTS.md) | Orquestração (canônico) |
| [agents.md](../../agents.md) | Entrada agents + índice de skills |
| [.cursor/skills/](../../.cursor/skills/) | 8 skills de domínio |

## Contratos e requisitos

| Arquivo | Função |
|---------|--------|
| [docs/contracts/rbac-matrix.md](../../docs/contracts/rbac-matrix.md) | Matriz RBAC hierárquica |
| [docs/analise-requisitos-consolidada.md](../../docs/analise-requisitos-consolidada.md) | Escopo de negócio |
| [docs/contracts/openapi.yaml](../../docs/contracts/openapi.yaml) | Contrato API |

## ADRs (`docs/memory/decisions/`)

| ADR | Tema |
|-----|------|
| 001 | Lovable híbrido |
| 002 | JWT + RBAC |
| 003 | Adimplência derivada |
| 004 | Estoque / inscrições |
| 005 | Portal público MVP |
| 006 | WhatsApp Chatwoot/N8N |
| 007 | Repositórios dual Git |
| 008 | Deferir Next.js |
| 009 | **Asaas como PSP** (substitui Stripe) |

## Playbooks / Runbooks

- Playbooks: `docs/memory/playbooks/` (financeiro, portal, recepção, chatwoot-n8n)
- Runbooks: `docs/memory/runbooks/` (deploy, import, LGPD, messaging)
- Roadmap: `docs/memory/roadmap-cronograma.md`
- Changelog: `docs/memory/CHANGELOG.md`

## Specs ativas

| Spec | Status |
|------|--------|
| 021-financeiro-asaas-gestor | Em implementação |
| 020-rbac-hierarquia-policies | ✅ V1 |
| 003-financeiro-v2 | ✅ Produção (estendido por 021) |
| 012-chatwoot-n8n | 🔄 Widget no ar |

## Regras de atualização

1. Toda feature não-trivial → `specs/<feature>/` antes do código
2. Ao encerrar → `project-memory.md` + `CHANGELOG.md`
3. Mudança de segurança/RBAC → matriz + ADR se necessário
4. Deploy VPS → acionar usuário (nunca automático)
