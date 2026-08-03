# Plan técnico — 021 Financeiro Asaas Gestor

Ver plano Cursor `financeiro_asaas_harness` e `tasks.md` nesta pasta.

## Camadas

1. Prisma migration (SetorAcesso.MARKETING, ContaFinanceira, Asaas*)
2. RBAC matrix + policies
3. `services/asaas/*` + webhook
4. Rotas `/financeiro/contas|transparencia`, `/cobrancas`, public ecommerce
5. Frontend ERP abas + `/app/marketing`
6. Smoke scripts + memória
