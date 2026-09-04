# Tasks — 034 Galeria de mídia

- [x] Spec + ADR-012 + rbac-matrix
- [x] Prisma migration `MidiaPublicacao`
- [x] Lib video URL + rotas API + testes visibilidade/agendamento
- [x] Media upload authorize marketing|eventos write
- [x] FE `/public/galeria` + detalhe + nav
- [x] FE `/app/galeria` + menu
- [x] FE Marketing CRUD galeria + upload
- [x] CSP frame-src YouTube/Vimeo
- [x] OpenAPI + memória + CHANGELOG
- [x] Validadores V1/V2
- [ ] Deploy VPS (gate humano)

## Validação V1 (integração) — 2026-09-04

| Check | OK | Ref |
|-------|----|-----|
| Rotas Express ↔ FE | ✅ | `galeria.ts` ↔ PublicGaleria / GaleriaPage / MarketingPage |
| Prisma ↔ migration | ✅ | `20260904120000_galeria_midia_034` |
| RBAC matrix ↔ policies | ✅ | `marketing` CRUD; `authorizeAny(['marketing','eventos'])` media |
| CSP embeds | ✅ | nginx `frame-src` YouTube/Vimeo |

## Validação V2 (qualidade) — 2026-09-04

| Check | OK |
|-------|----|
| Constitution (RBAC backend, deploy gate) | ✅ |
| Vitest video-url + FE/BE tsc | ✅ |
| Docs / ADR-012 / CHANGELOG | ✅ |
| Deploy VPS | ⏸ Aguarda confirmação do usuário |
