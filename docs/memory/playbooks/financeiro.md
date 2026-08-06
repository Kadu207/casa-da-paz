# Playbook — Módulo Financeiro

## Tarefas recorrentes
- Conciliação mensalidades (FINANCEIRO)
- Agenda **pagamentos a fazer** (saídas) — separado de atrasados
- Contas a pagar / fornecedores / baixas
- Gerar mensalidades (`/mensalidade-planos/gerar` ou job 6h)
- DRE e orçamento mensal
- Import OFX e conciliação
- Revisão atrasados (receber) → N8N lembrete WhatsApp
- Cobranças Asaas — **opcional** (dormant sem chave)

## PSP
- Asaas (ADR-009) — opcional; sandbox quando houver chave
- Tesouraria **não depende** do Asaas

## Agentes
Construção: `agent-backend-api` + `agent-frontend-ux`  
Ops: `agent-tesouraria-ops`, `agent-recorrencia-mensalidade`, `agent-conciliacao-bancaria`, `agent-relatorios-dre`

## Specs
022–025 (tesouraria), 021 (Asaas dormant)
