-- AlterEnum SetorAcesso
ALTER TYPE "SetorAcesso" ADD VALUE IF NOT EXISTS 'MARKETING';

-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "TipoContaFinanceira" AS ENUM ('CAIXA', 'BANCO', 'ASAAS');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "OrigemTransacao" AS ENUM ('MANUAL', 'PDV', 'EVENTO', 'ECOMMERCE', 'ASSINATURA', 'IMPORT');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "AsaasBillingType" AS ENUM ('BOLETO', 'PIX', 'CREDIT_CARD', 'UNDEFINED');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "AsaasCobrancaStatus" AS ENUM ('PENDING', 'RECEIVED', 'CONFIRMED', 'OVERDUE', 'REFUNDED', 'DELETED', 'RECEIVED_IN_CASH');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "AsaasAssinaturaStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'EXPIRED', 'CANCELLED');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Contas financeiras
CREATE TABLE IF NOT EXISTS "contas_financeiras" (
    "id" SERIAL NOT NULL,
    "nome" VARCHAR(100) NOT NULL,
    "tipo" "TipoContaFinanceira" NOT NULL,
    "saldo_inicial" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "ativa" BOOLEAN NOT NULL DEFAULT true,
    "asaas_wallet_id" VARCHAR(80),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "contas_financeiras_pkey" PRIMARY KEY ("id")
);

-- Financeiro transacao extensions
ALTER TABLE "financeiro_transacoes" ADD COLUMN IF NOT EXISTS "conta_id" INTEGER;
ALTER TABLE "financeiro_transacoes" ADD COLUMN IF NOT EXISTS "origem" "OrigemTransacao" NOT NULL DEFAULT 'MANUAL';
ALTER TABLE "financeiro_transacoes" ADD COLUMN IF NOT EXISTS "asaas_payment_id" VARCHAR(80);
ALTER TABLE "financeiro_transacoes" ADD COLUMN IF NOT EXISTS "asaas_subscription_id" VARCHAR(80);

CREATE INDEX IF NOT EXISTS "financeiro_transacoes_conta_id_idx" ON "financeiro_transacoes"("conta_id");
CREATE INDEX IF NOT EXISTS "financeiro_transacoes_asaas_payment_id_idx" ON "financeiro_transacoes"("asaas_payment_id");

DO $$ BEGIN
  ALTER TABLE "financeiro_transacoes" ADD CONSTRAINT "financeiro_transacoes_conta_id_fkey"
    FOREIGN KEY ("conta_id") REFERENCES "contas_financeiras"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Ecommerce: Stripe -> Asaas
ALTER TABLE "ecommerce_pedidos" ADD COLUMN IF NOT EXISTS "asaas_payment_id" VARCHAR(80);
ALTER TABLE "ecommerce_pedidos" ADD COLUMN IF NOT EXISTS "asaas_invoice_url" VARCHAR(500);
CREATE INDEX IF NOT EXISTS "ecommerce_pedidos_asaas_payment_id_idx" ON "ecommerce_pedidos"("asaas_payment_id");

ALTER TABLE "ecommerce_pedidos" DROP COLUMN IF EXISTS "stripe_session_id";
ALTER TABLE "ecommerce_pedidos" DROP COLUMN IF EXISTS "stripe_payment_intent_id";

-- Asaas tables
CREATE TABLE IF NOT EXISTS "asaas_clientes" (
    "id" SERIAL NOT NULL,
    "asaas_customer_id" VARCHAR(80) NOT NULL,
    "pessoa_id" INTEGER,
    "ecommerce_cliente_id" INTEGER,
    "cpf_cnpj" VARCHAR(18),
    "email" VARCHAR(150),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "asaas_clientes_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "asaas_clientes_asaas_customer_id_key" ON "asaas_clientes"("asaas_customer_id");
CREATE INDEX IF NOT EXISTS "asaas_clientes_pessoa_id_idx" ON "asaas_clientes"("pessoa_id");
CREATE INDEX IF NOT EXISTS "asaas_clientes_ecommerce_cliente_id_idx" ON "asaas_clientes"("ecommerce_cliente_id");

DO $$ BEGIN
  ALTER TABLE "asaas_clientes" ADD CONSTRAINT "asaas_clientes_pessoa_id_fkey"
    FOREIGN KEY ("pessoa_id") REFERENCES "pessoas"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "asaas_clientes" ADD CONSTRAINT "asaas_clientes_ecommerce_cliente_id_fkey"
    FOREIGN KEY ("ecommerce_cliente_id") REFERENCES "ecommerce_clientes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "asaas_assinaturas" (
    "id" SERIAL NOT NULL,
    "asaas_subscription_id" VARCHAR(80) NOT NULL,
    "pessoa_id" INTEGER NOT NULL,
    "valor" DECIMAL(10,2) NOT NULL,
    "cycle" VARCHAR(20) NOT NULL DEFAULT 'MONTHLY',
    "billing_type" "AsaasBillingType" NOT NULL,
    "status" "AsaasAssinaturaStatus" NOT NULL DEFAULT 'ACTIVE',
    "next_due_date" DATE,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "asaas_assinaturas_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "asaas_assinaturas_asaas_subscription_id_key" ON "asaas_assinaturas"("asaas_subscription_id");
CREATE INDEX IF NOT EXISTS "asaas_assinaturas_pessoa_id_idx" ON "asaas_assinaturas"("pessoa_id");
CREATE INDEX IF NOT EXISTS "asaas_assinaturas_status_idx" ON "asaas_assinaturas"("status");

DO $$ BEGIN
  ALTER TABLE "asaas_assinaturas" ADD CONSTRAINT "asaas_assinaturas_pessoa_id_fkey"
    FOREIGN KEY ("pessoa_id") REFERENCES "pessoas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "asaas_cobrancas" (
    "id" SERIAL NOT NULL,
    "asaas_payment_id" VARCHAR(80) NOT NULL,
    "status" "AsaasCobrancaStatus" NOT NULL DEFAULT 'PENDING',
    "billing_type" "AsaasBillingType" NOT NULL,
    "valor" DECIMAL(10,2) NOT NULL,
    "vencimento" DATE NOT NULL,
    "invoice_url" VARCHAR(500),
    "pix_qr_code" TEXT,
    "pix_copia_cola" TEXT,
    "external_ref" VARCHAR(120),
    "transacao_id" INTEGER,
    "pedido_id" INTEGER,
    "inscricao_id" INTEGER,
    "assinatura_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "asaas_cobrancas_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "asaas_cobrancas_asaas_payment_id_key" ON "asaas_cobrancas"("asaas_payment_id");
CREATE INDEX IF NOT EXISTS "asaas_cobrancas_status_idx" ON "asaas_cobrancas"("status");
CREATE INDEX IF NOT EXISTS "asaas_cobrancas_transacao_id_idx" ON "asaas_cobrancas"("transacao_id");
CREATE INDEX IF NOT EXISTS "asaas_cobrancas_pedido_id_idx" ON "asaas_cobrancas"("pedido_id");
CREATE INDEX IF NOT EXISTS "asaas_cobrancas_inscricao_id_idx" ON "asaas_cobrancas"("inscricao_id");

DO $$ BEGIN
  ALTER TABLE "asaas_cobrancas" ADD CONSTRAINT "asaas_cobrancas_transacao_id_fkey"
    FOREIGN KEY ("transacao_id") REFERENCES "financeiro_transacoes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "asaas_cobrancas" ADD CONSTRAINT "asaas_cobrancas_pedido_id_fkey"
    FOREIGN KEY ("pedido_id") REFERENCES "ecommerce_pedidos"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "asaas_cobrancas" ADD CONSTRAINT "asaas_cobrancas_inscricao_id_fkey"
    FOREIGN KEY ("inscricao_id") REFERENCES "inscricoes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "asaas_cobrancas" ADD CONSTRAINT "asaas_cobrancas_assinatura_id_fkey"
    FOREIGN KEY ("assinatura_id") REFERENCES "asaas_assinaturas"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "asaas_webhook_events" (
    "id" SERIAL NOT NULL,
    "event_id" VARCHAR(120) NOT NULL,
    "event_type" VARCHAR(80) NOT NULL,
    "payload" JSONB NOT NULL,
    "processed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "asaas_webhook_events_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "asaas_webhook_events_event_id_key" ON "asaas_webhook_events"("event_id");

-- Seed default accounts
INSERT INTO "contas_financeiras" ("nome", "tipo", "saldo_inicial", "ativa", "updated_at")
SELECT 'Caixa físico', 'CAIXA', 0, true, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "contas_financeiras" WHERE "nome" = 'Caixa físico');

INSERT INTO "contas_financeiras" ("nome", "tipo", "saldo_inicial", "ativa", "updated_at")
SELECT 'Conta Asaas', 'ASAAS', 0, true, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "contas_financeiras" WHERE "nome" = 'Conta Asaas');
