# ADR-001: Estratégia Lovable Híbrida

**Status:** Aceito | **Data:** 2026-06-05

## Contexto
Lovable acelera UI mas tem limitações com API Key para backend customizado.

## Decisão
- Lovable **apenas** para protótipo visual por módulo
- Export para branch `lovable/export-<modulo>`
- Desenvolvimento produção 100% no Cursor (`frontend/`)
- API sempre separada em `backend/`

## Consequências
- Design tokens documentados em `frontend/src/styles/tokens.css`
- Agente A3 refatora exports Lovable removendo mocks
