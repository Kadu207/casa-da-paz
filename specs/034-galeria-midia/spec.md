# Feature 034 — Galeria de mídia (fotos e vídeos)

**Status:** ✅ Produção (`0638b6c`) | **Atualizado:** 2026-09-04

## Objetivo

Página estilo YouTube para publicar e divulgar **fotos** e **vídeos** gerados na Casa da Paz, com controle de **visibilidade** (público vs interno) e **agendamento** opcional de publicação.

## Decisões

| Tema | Escolha |
|------|---------|
| Fotos | Upload Cloudflare Images |
| Vídeos | Embed YouTube/Vimeo (sem upload de arquivo nesta wave) |
| Visibilidade | `PUBLICO` \| `INTERNO` por item |
| Agendamento | `publicadoEm` opcional; até a data o item não aparece no destino |
| Quem publica | MARKETING / DIRETORIA (`marketing` write) |
| Quem vê interno | Qualquer usuário autenticado no ERP (`/app/galeria`) |
| Quem vê público | Anônimo em `/public/galeria` |

## Modelo

`MidiaPublicacao` — tipo, título, descrição, slug, imagemUrl, videoUrl, visibilidade, status, publicadoEm, ordem, createdById?

## API

- Público: `GET /api/public/galeria`, `GET /api/public/galeria/:slug`
- ERP: `GET /api/galeria` (JWT — público + interno ao vivo)
- Marketing: `/api/marketing/galeria` CRUD

## UI

- Portal: `/public/galeria`, `/public/galeria/:slug`
- ERP consumo: `/app/galeria`
- Admin: seção Galeria em Marketing

## Fora de escopo (wave 1)

Upload de arquivo de vídeo, comentários, likes, playlists, CDN signed URLs.

## Referências

- ADR: `docs/memory/decisions/012-galeria-midia.md`
- Matriz: `docs/contracts/rbac-matrix.md`
