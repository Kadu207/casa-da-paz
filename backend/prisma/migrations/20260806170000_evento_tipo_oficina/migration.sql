-- CreateEnum
CREATE TYPE "TipoEvento" AS ENUM ('GIRA', 'OFICINA');

-- AlterTable
ALTER TABLE "eventos" ADD COLUMN "tipo" "TipoEvento" NOT NULL DEFAULT 'GIRA';

-- Backfill oficinas by name
UPDATE "eventos"
SET "tipo" = 'OFICINA'
WHERE lower("nome_evento") LIKE '%oficina%';

-- CreateIndex
CREATE INDEX "eventos_tipo_status_data_evento_idx" ON "eventos"("tipo", "status", "data_evento");
