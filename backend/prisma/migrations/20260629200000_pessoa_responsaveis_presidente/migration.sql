-- Presidente(a) + responsáveis legais para menores
ALTER TYPE "TipoPerfil" ADD VALUE IF NOT EXISTS 'PRESIDENTE';

CREATE TABLE "pessoa_responsaveis" (
    "id" SERIAL NOT NULL,
    "pessoa_id" INTEGER NOT NULL,
    "nome_completo" VARCHAR(150) NOT NULL,
    "telefone" VARCHAR(20),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pessoa_responsaveis_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "pessoa_responsaveis_pessoa_id_idx" ON "pessoa_responsaveis"("pessoa_id");

ALTER TABLE "pessoa_responsaveis" ADD CONSTRAINT "pessoa_responsaveis_pessoa_id_fkey" FOREIGN KEY ("pessoa_id") REFERENCES "pessoas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
