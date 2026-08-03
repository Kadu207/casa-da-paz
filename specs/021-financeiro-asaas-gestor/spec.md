# Feature 021 — Gestor Financeiro + Asaas + Marketing

**Status:** Em implementação | **Data:** 2026-08-02  
**Estende:** `003-financeiro-v2`, `020-rbac-hierarquia-policies`  
**ADR:** [009-asaas-psp](../../docs/memory/decisions/009-asaas-psp.md)

## Objetivo

Entregar gestor financeiro completo com PSP Asaas (sandbox padrão), contas, transparência interna, cobranças/assinaturas de médiuns, e papel MARKETING para publicar eventos e livros — sem acesso a baixas financeiras.

## Personas

| Persona | Setor | Necessidade |
|---------|-------|-------------|
| Tesoureiro | FINANCEIRO | Contas, cobranças Asaas, fluxo, transparência |
| Diretoria | DIRETORIA | Visão total + transparência |
| Comunicação | MARKETING | Publicar eventos e livros no portal |
| Médium | MEDIUM | Ver próprias mensalidades/assinatura |

## Escopo

- ContaFinanceira (CAIXA/BANCO/ASAAS)
- Asaas: customers, payments, subscriptions, webhooks, balance
- Checkout livraria/eventos via Asaas (substitui Stripe)
- Assinaturas mensais de médiuns
- Transparência **interna** ERP
- RBAC: MARKETING + resources marketing/transparencia/contas/cobrancas

## Fora de escopo

- Transparência pública
- Deploy VPS / chave produção
- NF-e, OFX, split marketplace
