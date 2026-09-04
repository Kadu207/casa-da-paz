# Feature 034 — Galeria de mídia (fotos e vídeos)

**Status:** ✅ Produção (`32b9f22`) | **Atualizado:** 2026-09-04

## Objetivo

Página estilo YouTube para publicar e divulgar **fotos** e **vídeos** gerados na Casa da Paz, com controle de **visibilidade** (público vs privado), **álbuns** de referência (ex. Batizado 2026) e **agendamento** opcional de publicação.

## Decisões

| Tema | Escolha |
|------|---------|
| Fotos | Upload Cloudflare Images |
| Vídeos | Embed YouTube/Vimeo (sem upload de arquivo nesta wave) |
| Visibilidade | `PUBLICO` \| `PRIVADO` por item (API aceita alias `INTERNO` → `PRIVADO`) |
| Álbuns | `MidiaAlbum` (nome/slug); item opcionalmente ligado a um álbum |
| Agendamento | `publicadoEm` opcional; até a data o item não aparece no destino |
| Quem publica | MARKETING / DIRETORIA / ADMIN / SUPERVISOR (`marketing` write) |
| Quem vê privado | Qualquer usuário autenticado no ERP (`/app/galeria`) |
| Quem vê público | Anônimo em `/public/galeria` |

## Modelo

- `MidiaAlbum` — nome, slug, ordem, ativo  
- `MidiaPublicacao` — tipo, título, descrição, slug, imagemUrl, videoUrl, visibilidade, status, publicadoEm, ordem, albumId?, createdById?

## API

- Público: `GET /api/public/galeria`, `GET /api/public/galeria/:slug`, `GET /api/public/galeria/albuns`
- ERP: `GET /api/galeria` (JWT — público + privado ao vivo), `GET /api/galeria/albuns`
- Marketing: `/api/marketing/galeria` CRUD + `/api/marketing/galeria/albuns`

## UI

- Portal: `/public/galeria`, `/public/galeria/:slug` (+ filtro por álbum)
- ERP consumo: `/app/galeria` (+ filtro por álbum)
- Admin: seção Galeria em Marketing — Público/Privado + criar/selecionar álbum

## Fora de escopo (wave 1)

Upload de arquivo de vídeo, comentários, likes, playlists, CDN signed URLs.

## Referências

- ADR: `docs/memory/decisions/012-galeria-midia.md`
- Matriz: `docs/contracts/rbac-matrix.md`
