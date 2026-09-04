# ADR-012 — Galeria de mídia (público vs privado + álbuns)

**Status:** Aceito e em produção | **Data:** 2026-09-04 | **Spec:** 034 | **Deploy:** `32b9f22` (+ docs refresh)

## Contexto

A casa precisa divulgar fotos e vídeos (gira, eventos, atmosfera) em formato estilo YouTube, com itens **públicos** (portal) e **privados** (só ERP logado), agrupados por **álbum** (ex.: Batizado 2026, Festa dos Erês 2026), e opção de agendar a data de publicação.

## Decisão

1. Model `MidiaPublicacao` com `visibilidade` (`PUBLICO`|`PRIVADO`), `status` (`RASCUNHO`|`PUBLICADO`), `publicadoEm` opcional e `albumId` opcional.
2. Model `MidiaAlbum` (`midias_albuns`): nome/slug únicos — identifica a que o conteúdo se refere.
3. Enum legado: API aceita alias `INTERNO` → `PRIVADO` (compat); schema canônico é `PRIVADO`.
4. Fotos: Cloudflare Images. Vídeos wave 1: URL YouTube/Vimeo validada no backend.
5. Gate de descoberta: listagens públicas nunca retornam `PRIVADO`; URLs de CDN públicas na v1 (sem signed URL).
6. RBAC de escrita: resource `marketing`; consumo ERP: qualquer JWT autenticado.
7. CSP: `frame-src` inclui YouTube (nocookie) e Vimeo player.

## Consequências

- Marketing publica foto/vídeo com Público/Privado + álbum sem depender de Asaas ou upload de vídeo nativo.
- Portal e ERP filtram por álbum; álbuns de exemplo seedados na migration `20260904160000_galeria_albuns_privado_034`.
- Wave 2 pode adicionar Cloudflare Stream / R2 e variants privadas se necessário.
