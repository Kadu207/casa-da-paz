# Runbook — Importação Excel

1. Upload `.xlsx` via painel Financeiro
2. Backend encaminha ao `ai-service` `/parse-excel`
3. Validador `/validar-lote` — se erros, rollback total
4. Backend insere em transação Prisma `$transaction`
5. Log de erros exibido no frontend com número da linha
