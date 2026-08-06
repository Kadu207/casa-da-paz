# Feature 023 — Recorrência mensalidade médiuns

**Status:** ✅ Implementado | **Sem Asaas** | **Atualizado:** 2026-08-06

Plano mensal por pessoa (`MensalidadePlano`) + job `gerar-mensalidades` (boot + a cada 6h) gera MENSALIDADE PENDENTE se não existir no mês.

## API / UI
- `/api/mensalidade-planos` (+ `/gerar`)
- `/app/financeiro/recorrencia`
- Coluna Mensalidade em Cadastros → Médiuns
