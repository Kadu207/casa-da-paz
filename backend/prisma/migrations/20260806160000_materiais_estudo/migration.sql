-- CreateEnum
CREATE TYPE "CategoriaMaterialEstudo" AS ENUM ('ERVAS', 'BANHOS', 'DEFUMACAO', 'OUTROS');

-- CreateTable
CREATE TABLE "materiais_estudo" (
    "id" SERIAL NOT NULL,
    "slug" VARCHAR(120) NOT NULL,
    "categoria" "CategoriaMaterialEstudo" NOT NULL,
    "titulo" VARCHAR(150) NOT NULL,
    "resumo" VARCHAR(400) NOT NULL,
    "corpo" TEXT NOT NULL,
    "imagem_url" VARCHAR(500),
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "publicado" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "materiais_estudo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "materiais_estudo_slug_key" ON "materiais_estudo"("slug");

-- CreateIndex
CREATE INDEX "materiais_estudo_publicado_categoria_ordem_idx" ON "materiais_estudo"("publicado", "categoria", "ordem");
