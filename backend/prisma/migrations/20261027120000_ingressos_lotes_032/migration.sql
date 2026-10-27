-- Spec 032 / ADR-013: lotes de ingresso + código + cancelamento

CREATE TABLE "ingresso_lotes" (
    "id" SERIAL NOT NULL,
    "evento_id" INTEGER NOT NULL,
    "nome" VARCHAR(100) NOT NULL,
    "quantidade" INTEGER NOT NULL,
    "valor" DECIMAL(10,2) NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ingresso_lotes_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ingresso_lotes_evento_id_ativo_idx" ON "ingresso_lotes"("evento_id", "ativo");

ALTER TABLE "ingresso_lotes" ADD CONSTRAINT "ingresso_lotes_evento_id_fkey" FOREIGN KEY ("evento_id") REFERENCES "eventos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "inscricoes" ADD COLUMN "ingresso_lote_id" INTEGER,
ADD COLUMN "codigo" VARCHAR(16),
ADD COLUMN "cancelada_em" TIMESTAMP(3);

CREATE UNIQUE INDEX "inscricoes_codigo_key" ON "inscricoes"("codigo");

CREATE INDEX "inscricoes_ingresso_lote_id_cancelada_em_idx" ON "inscricoes"("ingresso_lote_id", "cancelada_em");

ALTER TABLE "inscricoes" ADD CONSTRAINT "inscricoes_ingresso_lote_id_fkey" FOREIGN KEY ("ingresso_lote_id") REFERENCES "ingresso_lotes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
