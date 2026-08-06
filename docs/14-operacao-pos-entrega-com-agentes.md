# 14 — Operação pós-entrega com agentes

## Objetivo

Manter qualidade, segurança e evolução após entrega, usando skills de `agents.md`.

## Papéis

### Construção / mudança
Ver `docs/11-agentes-e-operacao-cursor.md` (orquestrador → domínio → validadores).

### Operação financeira (pós-construção)

| Skill | Uso |
|-------|-----|
| `agent-tesouraria-ops` | Contas a pagar, baixas, agenda, patrocínios |
| `agent-recorrencia-mensalidade` | Geração de mensalidades |
| `agent-conciliacao-bancaria` | OFX |
| `agent-relatorios-dre` | DRE / orçamento |
| `agent-alertas-financeiros` | Atrasados / vencendo → N8N |

Playbook: `docs/memory/playbooks/financeiro.md`

### Outros

- `/suporte` triagem · `/incidente` P1/P2 · `/compliance` LGPD · `/melhoria` roadmap  

## Fluxo mínimo

1. Classificar severidade  
2. Reproduzir + evidências  
3. Corrigir / workaround / melhoria  
4. Teste de regressão + smoke se financeiro  
5. Atualizar CHANGELOG + `project-memory.md`  
6. Deploy só com confirmação  

## SLOs sugeridos

- P1: ack 15 min · mitigação ≤ 1 h  
- P2: ack 1 h · plano no mesmo dia  
- P3/P4: backlog semanal  
