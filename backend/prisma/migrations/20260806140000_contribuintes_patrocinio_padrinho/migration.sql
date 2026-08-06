-- CreateEnum
CREATE TYPE "TipoContribuinte" AS ENUM ('PATROCINIO', 'PADRINHO');

-- CreateTable
CREATE TABLE "contribuintes" (
    "id" SERIAL NOT NULL,
    "tipo" "TipoContribuinte" NOT NULL,
    "nome" VARCHAR(150) NOT NULL,
    "valor" DECIMAL(12,2) NOT NULL,
    "telefone" VARCHAR(20),
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "observacao" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contribuintes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "contribuintes_tipo_ativo_idx" ON "contribuintes"("tipo", "ativo");
