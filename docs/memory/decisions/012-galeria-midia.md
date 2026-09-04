# ADR-012 — Galeria de mídia (público vs interno)

**Status:** Aceito | **Data:** 2026-09-04 | **Spec:** 034

## Contexto

A casa precisa divulgar fotos e vídeos (gira, eventos, atmosfera) em formato estilo YouTube, com itens **públicos** (portal) e **internos** (só ERP logado), e opção de agendar a data de publicação.

## Decisão

1. Model `MidiaPublicacao` com `visibilidade` (PUBLICO|INTERNO), `status` (RASCUNHO|PUBLICADO) e `publicadoEm` opcional.
2. Fotos: Cloudflare Images (já existente). Vídeos wave 1: URL YouTube/Vimeo validada no backend.
3. Gate de descoberta na API: listagens públicas nunca retornam INTERNO; URLs de CDN públicas aceitas na v1 (sem signed URL).
4. RBAC de escrita: resource `marketing`; consumo interno: qualquer JWT autenticado.
5. CSP: `frame-src` inclui YouTube (nocookie) e Vimeo player.

## Consequências

- Marketing publica sem depender de Asaas ou upload de vídeo nativo.
- Wave 2 pode adicionar Cloudflare Stream / R2 e variants privadas se necessário.
