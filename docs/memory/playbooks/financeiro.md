# Playbook — Módulo Financeiro

## Tarefas recorrentes
- Conciliação mensalidades (FINANCEIRO)
- Revisão atrasados → N8N lembrete WhatsApp
- Dashboard semanal (DIRETORIA)
- Cobranças Asaas (PIX/boleto/cartão) + assinaturas médiuns
- Contas (caixa/banco/Asaas) e transparência interna
- Webhook Asaas: verificar idempotência e status ledger

## PSP
- **Asaas** (ADR-009) — sandbox padrão; produção só com confirmação
- Env: `ASAAS_API_KEY`, `ASAAS_ENV`, `ASAAS_WEBHOOK_TOKEN`, `ASAAS_WALLET_ID`

## Agente líder
`agent-backend-api` + `agent-frontend-ux` (+ `agent-arquitetura-seguranca` para policies)

## Spec
`specs/021-financeiro-asaas-gestor/`
