-- AlterTable
ALTER TABLE "agendamentos_publicos" ADD COLUMN "pessoa_id" INTEGER;

-- AddForeignKey
ALTER TABLE "agendamentos_publicos" ADD CONSTRAINT "agendamentos_publicos_pessoa_id_fkey" FOREIGN KEY ("pessoa_id") REFERENCES "pessoas"("id") ON DELETE SET NULL ON UPDATE CASCADE;
