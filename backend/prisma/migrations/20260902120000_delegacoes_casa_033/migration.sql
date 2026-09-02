-- AlterTable
ALTER TABLE "pessoas" ADD COLUMN "email" VARCHAR(150);

-- CreateEnum
CREATE TYPE "StatusTarefaDelegacao" AS ENUM ('PENDENTE', 'CONCLUIDA', 'CANCELADA');

-- CreateTable
CREATE TABLE "funcoes_casa" (
    "id" SERIAL NOT NULL,
    "nome" VARCHAR(120) NOT NULL,
    "slug" VARCHAR(80) NOT NULL,
    "descricao" VARCHAR(500),
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "funcoes_casa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "funcao_responsaveis" (
    "id" SERIAL NOT NULL,
    "funcao_id" INTEGER NOT NULL,
    "pessoa_id" INTEGER NOT NULL,
    "papel" VARCHAR(80),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "funcao_responsaveis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tarefas_delegacao" (
    "id" SERIAL NOT NULL,
    "funcao_id" INTEGER NOT NULL,
    "pessoa_id" INTEGER,
    "titulo" VARCHAR(200) NOT NULL,
    "descricao" VARCHAR(2000),
    "status" "StatusTarefaDelegacao" NOT NULL DEFAULT 'PENDENTE',
    "vencimento" DATE,
    "concluida_em" TIMESTAMP(3),
    "concluida_por_usuario_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tarefas_delegacao_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "funcoes_casa_slug_key" ON "funcoes_casa"("slug");

-- CreateIndex
CREATE INDEX "funcoes_casa_ativo_ordem_idx" ON "funcoes_casa"("ativo", "ordem");

-- CreateIndex
CREATE INDEX "funcao_responsaveis_pessoa_id_idx" ON "funcao_responsaveis"("pessoa_id");

-- CreateIndex
CREATE UNIQUE INDEX "funcao_responsaveis_funcao_id_pessoa_id_key" ON "funcao_responsaveis"("funcao_id", "pessoa_id");

-- CreateIndex
CREATE INDEX "tarefas_delegacao_funcao_id_status_idx" ON "tarefas_delegacao"("funcao_id", "status");

-- CreateIndex
CREATE INDEX "tarefas_delegacao_status_vencimento_idx" ON "tarefas_delegacao"("status", "vencimento");

-- CreateIndex
CREATE INDEX "tarefas_delegacao_pessoa_id_idx" ON "tarefas_delegacao"("pessoa_id");

-- AddForeignKey
ALTER TABLE "funcao_responsaveis" ADD CONSTRAINT "funcao_responsaveis_funcao_id_fkey" FOREIGN KEY ("funcao_id") REFERENCES "funcoes_casa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "funcao_responsaveis" ADD CONSTRAINT "funcao_responsaveis_pessoa_id_fkey" FOREIGN KEY ("pessoa_id") REFERENCES "pessoas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tarefas_delegacao" ADD CONSTRAINT "tarefas_delegacao_funcao_id_fkey" FOREIGN KEY ("funcao_id") REFERENCES "funcoes_casa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tarefas_delegacao" ADD CONSTRAINT "tarefas_delegacao_pessoa_id_fkey" FOREIGN KEY ("pessoa_id") REFERENCES "pessoas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tarefas_delegacao" ADD CONSTRAINT "tarefas_delegacao_concluida_por_usuario_id_fkey" FOREIGN KEY ("concluida_por_usuario_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
