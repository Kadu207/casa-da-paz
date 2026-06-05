-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "TipoPerfil" AS ENUM ('CONSULENTE', 'MEDIUM', 'DIRETORIA', 'FUNCIONARIO');

-- CreateEnum
CREATE TYPE "SetorAcesso" AS ENUM ('DIRETORIA', 'FINANCEIRO', 'RECEPCAO', 'LIVRARIA', 'MEDIUM', 'SUPORTE');

-- CreateEnum
CREATE TYPE "TipoTransacao" AS ENUM ('RECEITA', 'DESPESA');

-- CreateEnum
CREATE TYPE "CategoriaReceita" AS ENUM ('MENSALIDADE', 'LIVRARIA', 'DOACAO', 'MANUTENCAO', 'EVENTOS', 'OFICINAS');

-- CreateEnum
CREATE TYPE "CategoriaDespesa" AS ENUM ('ESTRUTURA_MANUTENCAO', 'INSUMOS_TERREIRO', 'CUSTOS_OPERACIONAIS');

-- CreateEnum
CREATE TYPE "StatusTransacao" AS ENUM ('PENDENTE', 'CONCLUIDO');

-- CreateEnum
CREATE TYPE "StatusEvento" AS ENUM ('ABERTO', 'ENCERRADO');

-- CreateEnum
CREATE TYPE "TipoPresenca" AS ENUM ('MEDIUM', 'CONSULENTE');

-- CreateEnum
CREATE TYPE "TipoProduto" AS ENUM ('LIVRO', 'ERVA', 'ARTIGO');

-- CreateEnum
CREATE TYPE "TipoMovimentacao" AS ENUM ('ENTRADA', 'SAIDA');

-- CreateEnum
CREATE TYPE "StatusAgendamento" AS ENUM ('PENDENTE', 'CONFIRMADO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "CanalAlerta" AS ENUM ('WHATSAPP', 'EMAIL', 'SISTEMA');

-- CreateTable
CREATE TABLE "pessoas" (
    "id" SERIAL NOT NULL,
    "nome_completo" VARCHAR(150) NOT NULL,
    "telefone" VARCHAR(20),
    "maior_de_idade" BOOLEAN NOT NULL DEFAULT true,
    "tipo_perfil" "TipoPerfil" NOT NULL,
    "data_cadastro" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pessoas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuarios" (
    "id" SERIAL NOT NULL,
    "pessoa_id" INTEGER NOT NULL,
    "email" VARCHAR(100) NOT NULL,
    "senha_hash" VARCHAR(255) NOT NULL,
    "setor_acesso" "SetorAcesso" NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "financeiro_transacoes" (
    "id" SERIAL NOT NULL,
    "pessoa_id" INTEGER,
    "tipo" "TipoTransacao" NOT NULL,
    "categoria" VARCHAR(50) NOT NULL,
    "valor" DECIMAL(10,2) NOT NULL,
    "data_transacao" DATE NOT NULL,
    "vencimento" DATE,
    "status" "StatusTransacao" NOT NULL,
    "observacoes" TEXT,

    CONSTRAINT "financeiro_transacoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "eventos" (
    "id" SERIAL NOT NULL,
    "nome_evento" VARCHAR(100) NOT NULL,
    "data_evento" DATE NOT NULL,
    "status" "StatusEvento" NOT NULL DEFAULT 'ABERTO',
    "capacidade_max" INTEGER,

    CONSTRAINT "eventos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "presencas" (
    "id" SERIAL NOT NULL,
    "evento_id" INTEGER NOT NULL,
    "pessoa_id" INTEGER NOT NULL,
    "tipo_presenca" "TipoPresenca" NOT NULL,
    "nome_responsavel" VARCHAR(150),
    "horario_chegada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "presencas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "produtos" (
    "id" SERIAL NOT NULL,
    "nome" VARCHAR(150) NOT NULL,
    "tipo" "TipoProduto" NOT NULL,
    "preco" DECIMAL(10,2) NOT NULL,
    "estoque_atual" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "produtos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "estoque_movimentacoes" (
    "id" SERIAL NOT NULL,
    "produto_id" INTEGER NOT NULL,
    "tipo" "TipoMovimentacao" NOT NULL,
    "quantidade" INTEGER NOT NULL,
    "transacao_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "estoque_movimentacoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inscricoes" (
    "id" SERIAL NOT NULL,
    "evento_id" INTEGER NOT NULL,
    "pessoa_id" INTEGER NOT NULL,
    "valor" DECIMAL(10,2) NOT NULL,
    "status_pagamento" "StatusTransacao" NOT NULL,
    "vencimento" DATE,

    CONSTRAINT "inscricoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agendamentos_publicos" (
    "id" SERIAL NOT NULL,
    "nome" VARCHAR(150) NOT NULL,
    "telefone" VARCHAR(20) NOT NULL,
    "data_preferida" DATE,
    "observacao" TEXT,
    "status" "StatusAgendamento" NOT NULL DEFAULT 'PENDENTE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "agendamentos_publicos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alertas" (
    "id" SERIAL NOT NULL,
    "tipo" VARCHAR(50) NOT NULL,
    "mensagem" TEXT NOT NULL,
    "pessoa_id" INTEGER,
    "canal" "CanalAlerta" NOT NULL,
    "disparado" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "alertas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_pessoa_id_key" ON "usuarios"("pessoa_id");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "presencas_evento_id_pessoa_id_key" ON "presencas"("evento_id", "pessoa_id");

-- AddForeignKey
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_pessoa_id_fkey" FOREIGN KEY ("pessoa_id") REFERENCES "pessoas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financeiro_transacoes" ADD CONSTRAINT "financeiro_transacoes_pessoa_id_fkey" FOREIGN KEY ("pessoa_id") REFERENCES "pessoas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "presencas" ADD CONSTRAINT "presencas_evento_id_fkey" FOREIGN KEY ("evento_id") REFERENCES "eventos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "presencas" ADD CONSTRAINT "presencas_pessoa_id_fkey" FOREIGN KEY ("pessoa_id") REFERENCES "pessoas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estoque_movimentacoes" ADD CONSTRAINT "estoque_movimentacoes_produto_id_fkey" FOREIGN KEY ("produto_id") REFERENCES "produtos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inscricoes" ADD CONSTRAINT "inscricoes_evento_id_fkey" FOREIGN KEY ("evento_id") REFERENCES "eventos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inscricoes" ADD CONSTRAINT "inscricoes_pessoa_id_fkey" FOREIGN KEY ("pessoa_id") REFERENCES "pessoas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
