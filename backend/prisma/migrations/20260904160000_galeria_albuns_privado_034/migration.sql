-- Spec 034 — álbuns/referência + renomear INTERNO → PRIVADO

ALTER TYPE "VisibilidadeMidia" RENAME VALUE 'INTERNO' TO 'PRIVADO';

CREATE TABLE "midias_albuns" (
    "id" SERIAL NOT NULL,
    "nome" VARCHAR(150) NOT NULL,
    "slug" VARCHAR(120) NOT NULL,
    "descricao" VARCHAR(500),
    "ano" INTEGER,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "midias_albuns_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "midias_albuns_slug_key" ON "midias_albuns"("slug");
CREATE INDEX "midias_albuns_ativo_ordem_idx" ON "midias_albuns"("ativo", "ordem");

ALTER TABLE "midias_publicacao" ADD COLUMN "album_id" INTEGER;
CREATE INDEX "midias_publicacao_album_id_idx" ON "midias_publicacao"("album_id");
ALTER TABLE "midias_publicacao" ADD CONSTRAINT "midias_publicacao_album_id_fkey" FOREIGN KEY ("album_id") REFERENCES "midias_albuns"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Álbuns iniciais de exemplo (editáveis)
INSERT INTO "midias_albuns" ("nome", "slug", "ano", "ordem", "descricao", "updated_at") VALUES
  ('Batizado 2026', 'batizado-2026', 2026, 10, 'Registros do batizado', CURRENT_TIMESTAMP),
  ('Festa dos Erês 2026', 'festa-dos-eres-2026', 2026, 20, 'Festa dos Erês', CURRENT_TIMESTAMP);
