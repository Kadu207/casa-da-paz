CREATE TYPE "TipoLivrariaConteudo" AS ENUM ('NOVIDADE', 'DICA');

CREATE TABLE "livraria_conteudos" (
    "id" SERIAL NOT NULL,
    "tipo" "TipoLivrariaConteudo" NOT NULL,
    "titulo" VARCHAR(150) NOT NULL,
    "texto" TEXT NOT NULL,
    "produto_id" INTEGER,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "publicado" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "livraria_conteudos_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "livraria_conteudos_tipo_publicado_ordem_idx" ON "livraria_conteudos"("tipo", "publicado", "ordem");

ALTER TABLE "livraria_conteudos" ADD CONSTRAINT "livraria_conteudos_produto_id_fkey" FOREIGN KEY ("produto_id") REFERENCES "produtos"("id") ON DELETE SET NULL ON UPDATE CASCADE;
