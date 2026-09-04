-- Spec 034 — Galeria de mídia (fotos / vídeos YouTube-Vimeo)

CREATE TYPE "TipoMidiaPublicacao" AS ENUM ('FOTO', 'VIDEO');
CREATE TYPE "VisibilidadeMidia" AS ENUM ('PUBLICO', 'INTERNO');
CREATE TYPE "StatusMidiaPublicacao" AS ENUM ('RASCUNHO', 'PUBLICADO');

CREATE TABLE "midias_publicacao" (
    "id" SERIAL NOT NULL,
    "tipo" "TipoMidiaPublicacao" NOT NULL,
    "titulo" VARCHAR(150) NOT NULL,
    "descricao" VARCHAR(2000),
    "slug" VARCHAR(120) NOT NULL,
    "imagem_url" VARCHAR(500),
    "video_url" VARCHAR(500),
    "visibilidade" "VisibilidadeMidia" NOT NULL DEFAULT 'PUBLICO',
    "status" "StatusMidiaPublicacao" NOT NULL DEFAULT 'RASCUNHO',
    "publicado_em" TIMESTAMP(3),
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "created_by_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "midias_publicacao_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "midias_publicacao_slug_key" ON "midias_publicacao"("slug");
CREATE INDEX "midias_publicacao_status_visibilidade_publicado_em_idx" ON "midias_publicacao"("status", "visibilidade", "publicado_em");
CREATE INDEX "midias_publicacao_tipo_ordem_idx" ON "midias_publicacao"("tipo", "ordem");

ALTER TABLE "midias_publicacao" ADD CONSTRAINT "midias_publicacao_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
