# Feature 027 — Materiais de estudo (ervas, banhos, defumação)

**Status:** ✅ Implementado | **Atualizado:** 2026-08-06

## Objetivo
Conteúdo público de estudo sobre ervas, banhos, defumação e correlatos.  
Edição exclusiva da equipe de **Marketing / Comunicação**.

## Fluxo UX
1. Home → imagem **Ervas e oferendas** (galeria) → `/public/estudos`
2. Listagem com filtros por categoria → detalhe `/public/estudos/:slug`
3. ERP → Marketing → seção Materiais de estudo (CRUD + publicar)

## Modelo
`MaterialEstudo` — slug, categoria (ERVAS|BANHOS|DEFUMACAO|OUTROS), título, resumo, corpo, imagemUrl?, ordem, publicado

## API
- Público: `GET /api/public/materiais-estudo`, `GET /api/public/materiais-estudo/:slug`
- Marketing: `/api/marketing/materiais-estudo` (RBAC `marketing`)
