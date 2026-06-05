-- E-commerce: clientes, pedidos Stripe-ready, catálogo público

CREATE TYPE "StatusPedidoEcommerce" AS ENUM ('PENDENTE_PAGAMENTO', 'PAGO', 'CANCELADO', 'EXPIRADO');
CREATE TYPE "TipoClienteEcommerce" AS ENUM ('PF', 'PJ');

ALTER TABLE "produtos" ADD COLUMN "publicado_ecommerce" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "produtos" ADD COLUMN "descricao_ecommerce" TEXT;

CREATE TABLE "ecommerce_clientes" (
    "id" SERIAL NOT NULL,
    "tipo" "TipoClienteEcommerce" NOT NULL,
    "nome_completo" VARCHAR(150) NOT NULL,
    "cpf" VARCHAR(14),
    "cnpj" VARCHAR(18),
    "email" VARCHAR(150) NOT NULL,
    "telefone" VARCHAR(20),
    "cep" VARCHAR(9) NOT NULL,
    "logradouro" VARCHAR(200) NOT NULL,
    "numero" VARCHAR(20) NOT NULL,
    "complemento" VARCHAR(100),
    "bairro" VARCHAR(100) NOT NULL,
    "cidade" VARCHAR(100) NOT NULL,
    "estado" VARCHAR(2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ecommerce_clientes_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ecommerce_clientes_cpf_key" ON "ecommerce_clientes"("cpf");
CREATE UNIQUE INDEX "ecommerce_clientes_cnpj_key" ON "ecommerce_clientes"("cnpj");

CREATE TABLE "ecommerce_pedidos" (
    "id" SERIAL NOT NULL,
    "protocolo" VARCHAR(32) NOT NULL,
    "cliente_id" INTEGER NOT NULL,
    "status" "StatusPedidoEcommerce" NOT NULL DEFAULT 'PENDENTE_PAGAMENTO',
    "valor_total" DECIMAL(10,2) NOT NULL,
    "stripe_session_id" VARCHAR(120),
    "stripe_payment_intent_id" VARCHAR(120),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ecommerce_pedidos_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ecommerce_pedidos_protocolo_key" ON "ecommerce_pedidos"("protocolo");
CREATE INDEX "ecommerce_pedidos_status_idx" ON "ecommerce_pedidos"("status");
CREATE INDEX "ecommerce_pedidos_created_at_idx" ON "ecommerce_pedidos"("created_at");

CREATE TABLE "ecommerce_itens_pedido" (
    "id" SERIAL NOT NULL,
    "pedido_id" INTEGER NOT NULL,
    "produto_id" INTEGER NOT NULL,
    "quantidade" INTEGER NOT NULL,
    "preco_unitario" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "ecommerce_itens_pedido_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "ecommerce_pedidos" ADD CONSTRAINT "ecommerce_pedidos_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "ecommerce_clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ecommerce_itens_pedido" ADD CONSTRAINT "ecommerce_itens_pedido_pedido_id_fkey" FOREIGN KEY ("pedido_id") REFERENCES "ecommerce_pedidos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ecommerce_itens_pedido" ADD CONSTRAINT "ecommerce_itens_pedido_produto_id_fkey" FOREIGN KEY ("produto_id") REFERENCES "produtos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
