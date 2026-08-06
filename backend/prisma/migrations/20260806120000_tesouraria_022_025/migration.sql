-- Enums
DO $$ BEGIN CREATE TYPE "StatusContaPagar" AS ENUM ('PENDENTE', 'PARCIAL', 'PAGO', 'CANCELADO'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE "StatusParcela" AS ENUM ('PENDENTE', 'PAGO', 'CANCELADO'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE "StatusOfxMovimento" AS ENUM ('PENDENTE', 'CONCILIADO', 'IGNORADO'); EXCEPTION WHEN duplicate_object THEN null; END $$;

ALTER TYPE "OrigemTransacao" ADD VALUE IF NOT EXISTS 'RECORRENCIA';
ALTER TYPE "OrigemTransacao" ADD VALUE IF NOT EXISTS 'CONTA_PAGAR';
ALTER TYPE "OrigemTransacao" ADD VALUE IF NOT EXISTS 'OFX';

CREATE TABLE IF NOT EXISTS "centros_custo" (
  "id" SERIAL PRIMARY KEY,
  "codigo" VARCHAR(30) NOT NULL UNIQUE,
  "nome" VARCHAR(100) NOT NULL,
  "ativo" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "fornecedores" (
  "id" SERIAL PRIMARY KEY,
  "nome" VARCHAR(150) NOT NULL,
  "documento" VARCHAR(18),
  "telefone" VARCHAR(20),
  "ativo" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "contas_pagar" (
  "id" SERIAL PRIMARY KEY,
  "fornecedor_id" INTEGER REFERENCES "fornecedores"("id") ON DELETE SET NULL,
  "centro_custo_id" INTEGER REFERENCES "centros_custo"("id") ON DELETE SET NULL,
  "descricao" VARCHAR(200) NOT NULL,
  "categoria" VARCHAR(50) NOT NULL,
  "valor_total" DECIMAL(12,2) NOT NULL,
  "vencimento" DATE NOT NULL,
  "status" "StatusContaPagar" NOT NULL DEFAULT 'PENDENTE',
  "observacoes" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "contas_pagar_status_idx" ON "contas_pagar"("status");
CREATE INDEX IF NOT EXISTS "contas_pagar_vencimento_idx" ON "contas_pagar"("vencimento");

CREATE TABLE IF NOT EXISTS "contas_pagar_parcelas" (
  "id" SERIAL PRIMARY KEY,
  "conta_pagar_id" INTEGER NOT NULL REFERENCES "contas_pagar"("id") ON DELETE CASCADE,
  "numero" INTEGER NOT NULL,
  "valor" DECIMAL(12,2) NOT NULL,
  "vencimento" DATE NOT NULL,
  "status" "StatusParcela" NOT NULL DEFAULT 'PENDENTE',
  "pago_em" TIMESTAMP(3),
  "transacao_id" INTEGER UNIQUE REFERENCES "financeiro_transacoes"("id") ON DELETE SET NULL,
  UNIQUE ("conta_pagar_id", "numero")
);
CREATE INDEX IF NOT EXISTS "contas_pagar_parcelas_status_vencimento_idx" ON "contas_pagar_parcelas"("status", "vencimento");

CREATE TABLE IF NOT EXISTS "mensalidade_planos" (
  "id" SERIAL PRIMARY KEY,
  "pessoa_id" INTEGER NOT NULL UNIQUE REFERENCES "pessoas"("id") ON DELETE CASCADE,
  "valor" DECIMAL(10,2) NOT NULL,
  "dia_vencimento" INTEGER NOT NULL,
  "ativo" BOOLEAN NOT NULL DEFAULT true,
  "proxima_geracao" DATE,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "mensalidade_planos_ativo_idx" ON "mensalidade_planos"("ativo");

CREATE TABLE IF NOT EXISTS "orcamento_linhas" (
  "id" SERIAL PRIMARY KEY,
  "ano" INTEGER NOT NULL,
  "mes" INTEGER NOT NULL,
  "tipo" "TipoTransacao" NOT NULL,
  "categoria" VARCHAR(50) NOT NULL,
  "centro_custo_id" INTEGER REFERENCES "centros_custo"("id") ON DELETE SET NULL,
  "valor_planejado" DECIMAL(12,2) NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "orcamento_linhas_unique" ON "orcamento_linhas"("ano", "mes", "tipo", "categoria", COALESCE("centro_custo_id", 0));

ALTER TABLE "financeiro_transacoes" ADD COLUMN IF NOT EXISTS "centro_custo_id" INTEGER REFERENCES "centros_custo"("id") ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS "financeiro_transacoes_centro_custo_id_idx" ON "financeiro_transacoes"("centro_custo_id");

CREATE TABLE IF NOT EXISTS "ofx_imports" (
  "id" SERIAL PRIMARY KEY,
  "conta_id" INTEGER NOT NULL REFERENCES "contas_financeiras"("id"),
  "filename" VARCHAR(200) NOT NULL,
  "imported_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "qtd" INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS "ofx_movimentos" (
  "id" SERIAL PRIMARY KEY,
  "import_id" INTEGER NOT NULL REFERENCES "ofx_imports"("id") ON DELETE CASCADE,
  "fit_id" VARCHAR(120) NOT NULL UNIQUE,
  "data" DATE NOT NULL,
  "valor" DECIMAL(12,2) NOT NULL,
  "tipo" "TipoTransacao" NOT NULL,
  "memo" TEXT,
  "status" "StatusOfxMovimento" NOT NULL DEFAULT 'PENDENTE',
  "transacao_id" INTEGER UNIQUE REFERENCES "financeiro_transacoes"("id") ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS "ofx_movimentos_status_idx" ON "ofx_movimentos"("status");
CREATE INDEX IF NOT EXISTS "ofx_movimentos_data_idx" ON "ofx_movimentos"("data");

INSERT INTO "centros_custo" ("codigo", "nome")
SELECT 'GERAL', 'Geral'
WHERE NOT EXISTS (SELECT 1 FROM "centros_custo" WHERE "codigo" = 'GERAL');
