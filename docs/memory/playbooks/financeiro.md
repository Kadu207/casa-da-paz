# Playbook — Módulo Financeiro

**Atualizado:** 2026-08-06

## Escopo operacional

Tesouraria interna completa **sem Asaas**. PSP (021) só se houver chave.

## Tarefas recorrentes

| Tarefa | Onde | Agente ops |
|--------|------|------------|
| Lançamentos / conciliação | Financeiro → Lançamentos / Conciliação | `agent-tesouraria-ops` |
| Atrasados (receber) | Atrasados → N8N lembrete | `agent-alertas-financeiros` |
| Agenda a pagar | A pagar / Contas a pagar | `agent-tesouraria-ops` |
| Mensalidades | Recorrência ou coluna na lista de Médiuns | `agent-recorrencia-mensalidade` |
| Patrocínios / padrinhos | Patrocínios / Padrinhos | `agent-tesouraria-ops` |
| DRE / orçamento | DRE | `agent-relatorios-dre` |
| Extrato bancário | Extrato OFX | `agent-conciliacao-bancaria` |
| Cobranças Asaas | Cobranças — **opcional** | — |

## Separação importante

- **Atrasados** = recebíveis (mensalidades)  
- **A pagar** = saídas / ContaPagar  

## Cadastro de usuários (impacto financeiro)

SUPERVISOR define `setorAcesso` + policies (`financeiro`, `contas_pagar`, `recorrencia`, `dre`, `conciliacao_bancaria`, `contribuintes`, …) **no ato do cadastro**.

## APIs

| Path | Uso |
|------|-----|
| `/api/financeiro/*` | Ledger, fluxo, atrasados, DRE, OFX… |
| `/api/contas-pagar`, `/api/fornecedores` | AP |
| `/api/mensalidade-planos` | Planos + `/gerar` |
| `/api/contribuintes` | Patrocínio / padrinho |
| `/api/cobrancas` | Asaas opcional |

## Specs

022–025, contribuintes, 021 (dormant), ADR-003, ADR-009

## Smoke

```powershell
.\scripts\test-tesouraria-022.ps1
```
