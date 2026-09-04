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
- [x] Deploy VPS (migrate + rebuild + CSP) — 2026-09-04 `0638b6c`
- [x] Álbuns (`MidiaAlbum`) + visibilidade `PRIVADO` (ex-INTERNO) — `32b9f22`
- [x] Docs refresh PRIVADO/álbuns — ADR-012, playbook, OpenAPI, memória

## Validação V1 (integração) — 2026-09-04

| Check | OK | Ref |
|-------|----|-----|
| Rotas Express ↔ FE | ✅ | `galeria.ts` ↔ PublicGaleria / GaleriaPage / MarketingPage |
| Prisma ↔ migration | ✅ | `20260904120000` + `20260904160000` (álbuns/PRIVADO) |
| RBAC matrix ↔ policies | ✅ | `marketing` CRUD; `authorizeAny(['marketing','eventos'])` media |
| CSP embeds | ✅ | prod CSP inclui youtube-nocookie + vimeo |
| Álbuns + PRIVADO | ✅ | Marketing UI + filtros portal/ERP |

## Validação V2 (qualidade) — 2026-09-04

| Check | OK |
|-------|----|
| Constitution (RBAC backend, deploy gate) | ✅ |
| Vitest video-url + smoke + FE/BE tsc | ✅ |
| Docs / ADR-012 / CHANGELOG | ✅ |
| Deploy VPS | ✅ health + galeria + albuns APIs |
