# ADR-009 — Asaas como PSP (substitui Stripe)

**Status:** Aceito | **Data:** 2026-08-02  
**Spec:** `specs/021-financeiro-asaas-gestor/`

## Contexto

O ecommerce público e cobranças de mediuns/eventos precisavam de PSP brasileiro (PIX, boleto, cartão, assinaturas). Campos Stripe existiam no schema mas o checkout era stub (`checkoutUrl: null`).

## Decisão

- **Asaas** é o PSP oficial (API v3).
- Stripe fica **deprecated** — colunas `stripe_*` removidas/renomeadas para `asaas_*`.
- Ambiente padrão: **sandbox** (`ASAAS_ENV=sandbox`).
- Produção: somente após confirmação explícita do usuário no deploy VPS.
- Webhooks Asaas conciliam `FinanceiroTransacao`, `EcommercePedido`, `Inscricao` e assinaturas de médiuns de forma atômica e idempotente.

## Consequências

- Env: `ASAAS_API_KEY`, `ASAAS_ENV`, `ASAAS_WEBHOOK_TOKEN`, `ASAAS_WALLET_ID`.
- Remover/ignorar `STRIPE_*` em novos deploys.
- Transparência financeira permanece **interna** ao ERP (não pública).
