# Memória — índice vivo (Casa da Paz)

Atualizar `project-memory.md` ao encerrar cada tarefa.

## Núcleo

| Arquivo | Função |
|---------|--------|
| [constitution.md](constitution.md) | Princípios |
| [project-memory.md](project-memory.md) | Estado atual |
| [memory.md](memory.md) | Este índice |

## Documentação do produto

| Arquivo | Função |
|---------|--------|
| [docs/00-index.md](../../docs/00-index.md) | Índice da documentação |
| [docs/memory/CHANGELOG.md](../../docs/memory/CHANGELOG.md) | Changelog |
| [docs/memory/roadmap-cronograma.md](../../docs/memory/roadmap-cronograma.md) | Roadmap |
| [docs/contracts/rbac-matrix.md](../../docs/contracts/rbac-matrix.md) | RBAC |
| [docs/memory/playbooks/financeiro.md](../../docs/memory/playbooks/financeiro.md) | Ops tesouraria |
| [docs/memory/playbooks/portal-publico.md](../../docs/memory/playbooks/portal-publico.md) | Portal + galeria |

## Agentes

| Arquivo | Função |
|---------|--------|
| [agents.md](../../agents.md) | Construção + pós-operação |
| [.cursor/skills/](../../.cursor/skills/) | Skills domínio + ops |

## Specs ativas (status)

| Spec | Status |
|------|--------|
| 022–025 tesouraria | ✅ Prod |
| 026 contribuintes | ✅ Prod |
| 020 policies no cadastro | ✅ Prod |
| 021 Asaas | **Dormant** até chave |
| 027 materiais-estudo | ✅ Prod |
| 030 security-hardening | ✅ Prod (+ CSP OSM/YouTube) |
| 031 estoque-casa | ✅ Primário (ADR-010) |
| 033 delegacoes-casa | ✅ Prod (ADR-011) |
| **034 galeria-midia** | ✅ Prod (ADR-012) — PUBLICO/PRIVADO + álbuns + YouTube |
| 032 ingressos | 📋 Stub |
| Auditoria F01–F10 | ✅ GREEN |

## ADRs

001–012 em `docs/memory/decisions/` — **012 galeria mídia** (PUBLICO/PRIVADO + álbuns + YouTube).

## Pendências vivas

Ver `project-memory.md` e `docs/memory/roadmap-cronograma.md` (mensageria SMTP/WhatsApp, 032, Asaas).

## Regras

1. Spec antes de código  
2. Encerrar → project-memory + CHANGELOG  
3. Deploy VPS → gate humano  
4. Tesouraria **não** depende de Asaas  
5. Documentação canônica em `docs/00-index.md` (não usar refs Lovable como stack atual)  
