-- CreateEnum
CREATE TYPE "CategoriaEstoqueCasa" AS ENUM ('RITUAL', 'BEBIDA', 'TABACO', 'VELA', 'LIMPEZA', 'DESCARTAVEL', 'OUTROS');

-- CreateEnum
CREATE TYPE "UnidadeEstoqueCasa" AS ENUM ('UN', 'CX', 'PCT', 'L', 'ML', 'KG', 'G');

-- CreateEnum
CREATE TYPE "TipoMovEstoqueCasa" AS ENUM ('ENTRADA', 'SAIDA', 'AJUSTE');

-- CreateEnum
CREATE TYPE "StatusChecklistLimpeza" AS ENUM ('RASCUNHO', 'CONCLUIDO');

-- CreateTable
CREATE TABLE "itens_estoque_casa" (
    "id" SERIAL NOT NULL,
    "nome" VARCHAR(150) NOT NULL,
    "categoria" "CategoriaEstoqueCasa" NOT NULL,
    "unidade" "UnidadeEstoqueCasa" NOT NULL DEFAULT 'UN',
    "estoque_atual" INTEGER NOT NULL DEFAULT 0,
    "estoque_minimo" INTEGER NOT NULL DEFAULT 0,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "observacao" VARCHAR(500),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "itens_estoque_casa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "grupos_limpeza" (
    "id" SERIAL NOT NULL,
    "nome" VARCHAR(120) NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "responsavel_usuario_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "grupos_limpeza_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "checklists_limpeza" (
    "id" SERIAL NOT NULL,
    "grupo_id" INTEGER NOT NULL,
    "competencia" DATE NOT NULL,
    "status" "StatusChecklistLimpeza" NOT NULL DEFAULT 'RASCUNHO',
    "observacao" VARCHAR(500),
    "criado_por_usuario_id" INTEGER NOT NULL,
    "concluido_em" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "checklists_limpeza_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "checklist_limpeza_itens" (
    "id" SERIAL NOT NULL,
    "checklist_id" INTEGER NOT NULL,
    "item_id" INTEGER NOT NULL,
    "quantidade_baixa" INTEGER NOT NULL DEFAULT 0,
    "conferido" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "checklist_limpeza_itens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movimentacoes_estoque_casa" (
    "id" SERIAL NOT NULL,
    "item_id" INTEGER NOT NULL,
    "tipo" "TipoMovEstoqueCasa" NOT NULL,
    "quantidade" INTEGER NOT NULL,
    "saldo_apos" INTEGER NOT NULL,
    "motivo" VARCHAR(300),
    "usuario_id" INTEGER NOT NULL,
    "checklist_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "movimentacoes_estoque_casa_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "itens_estoque_casa_ativo_categoria_idx" ON "itens_estoque_casa"("ativo", "categoria");

-- CreateIndex
CREATE UNIQUE INDEX "itens_estoque_casa_nome_categoria_key" ON "itens_estoque_casa"("nome", "categoria");

-- CreateIndex
CREATE INDEX "grupos_limpeza_ativo_idx" ON "grupos_limpeza"("ativo");

-- CreateIndex
CREATE INDEX "grupos_limpeza_responsavel_usuario_id_idx" ON "grupos_limpeza"("responsavel_usuario_id");

-- CreateIndex
CREATE INDEX "checklists_limpeza_grupo_id_competencia_idx" ON "checklists_limpeza"("grupo_id", "competencia");

-- CreateIndex
CREATE INDEX "checklists_limpeza_status_idx" ON "checklists_limpeza"("status");

-- CreateIndex
CREATE UNIQUE INDEX "checklist_limpeza_itens_checklist_id_item_id_key" ON "checklist_limpeza_itens"("checklist_id", "item_id");

-- CreateIndex
CREATE INDEX "movimentacoes_estoque_casa_item_id_created_at_idx" ON "movimentacoes_estoque_casa"("item_id", "created_at");

-- CreateIndex
CREATE INDEX "movimentacoes_estoque_casa_created_at_idx" ON "movimentacoes_estoque_casa"("created_at");

-- AddForeignKey
ALTER TABLE "grupos_limpeza" ADD CONSTRAINT "grupos_limpeza_responsavel_usuario_id_fkey" FOREIGN KEY ("responsavel_usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checklists_limpeza" ADD CONSTRAINT "checklists_limpeza_grupo_id_fkey" FOREIGN KEY ("grupo_id") REFERENCES "grupos_limpeza"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checklists_limpeza" ADD CONSTRAINT "checklists_limpeza_criado_por_usuario_id_fkey" FOREIGN KEY ("criado_por_usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checklist_limpeza_itens" ADD CONSTRAINT "checklist_limpeza_itens_checklist_id_fkey" FOREIGN KEY ("checklist_id") REFERENCES "checklists_limpeza"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checklist_limpeza_itens" ADD CONSTRAINT "checklist_limpeza_itens_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "itens_estoque_casa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimentacoes_estoque_casa" ADD CONSTRAINT "movimentacoes_estoque_casa_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "itens_estoque_casa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimentacoes_estoque_casa" ADD CONSTRAINT "movimentacoes_estoque_casa_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimentacoes_estoque_casa" ADD CONSTRAINT "movimentacoes_estoque_casa_checklist_id_fkey" FOREIGN KEY ("checklist_id") REFERENCES "checklists_limpeza"("id") ON DELETE SET NULL ON UPDATE CASCADE;
