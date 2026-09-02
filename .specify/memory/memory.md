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

## Agentes

| Arquivo | Função |
|---------|--------|
| [agents.md](../../agents.md) | Construção + pós-operação |
| [.cursor/skills/](../../.cursor/skills/) | Skills domínio + ops |

## Specs tesouraria (sem Asaas)

| Spec | Status |
|------|--------|
| 022-contas-a-pagar | ✅ Implementado |
| 023-recorrencia-mensalidade | ✅ Implementado |
| 024-dre-orcamento-centros | ✅ Implementado |
| 025-conciliacao-ofx | ✅ Implementado |
| Contribuintes (patrocínio/padrinho) | ✅ Implementado |
| 020 policies no cadastro | ✅ Snapshot no POST usuários |
| 021 Asaas | **Dormant** até chave |
| 026 contribuintes | ✅ (spec dedicada) |
| 031 estoque-casa | ✅ Primário (ADR-010) |
| 030 security-hardening | ✅ Fase 0–2 + CSP mapa OSM (2026-09-02) |
| 033 delegacoes-casa | ✅ Prod (ADR-011) — N8N workflow importado |
| Auditoria F01–F10 | ✅ GREEN — [`docs/security-audit/ACHADOS.md`](../../docs/security-audit/ACHADOS.md) |

## ADRs

001–011 em `docs/memory/decisions/` — 002 (RBAC+policies), 009 Asaas opcional, **010 estoque primário**, **011 delegações**.

## Pendências vivas

Ver `project-memory.md` e `docs/memory/roadmap-cronograma.md` (mensageria SMTP/WhatsApp, 032, Asaas).

## Regras

1. Spec antes de código  
2. Encerrar → project-memory + CHANGELOG  
3. Deploy VPS → gate humano  
4. Tesouraria **não** depende de Asaas  
5. Documentação canônica em `docs/00-index.md` (não usar refs Lovable como stack atual)  
