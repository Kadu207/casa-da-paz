-- Financeiro v2: fechamentos mensais + índices de performance
CREATE TABLE IF NOT EXISTS "financeiro_fechamentos_mensais" (
    "id" SERIAL NOT NULL,
    "ano" INTEGER NOT NULL,
    "mes" INTEGER NOT NULL,
    "receitas_total" DECIMAL(12,2) NOT NULL,
    "despesas_total" DECIMAL(12,2) NOT NULL,
    "saldo" DECIMAL(12,2) NOT NULL,
    "pendentes_qtd" INTEGER NOT NULL,
    "atrasados_qtd" INTEGER NOT NULL,
    "observacoes" TEXT,
    "fechado_por_id" INTEGER NOT NULL,
    "fechado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "financeiro_fechamentos_mensais_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "financeiro_fechamentos_mensais_ano_mes_key"
    ON "financeiro_fechamentos_mensais"("ano", "mes");

ALTER TABLE "financeiro_fechamentos_mensais"
    ADD CONSTRAINT "financeiro_fechamentos_mensais_fechado_por_id_fkey"
    FOREIGN KEY ("fechado_por_id") REFERENCES "usuarios"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS "financeiro_transacoes_data_transacao_idx"
    ON "financeiro_transacoes"("data_transacao");

CREATE INDEX IF NOT EXISTS "financeiro_transacoes_vencimento_idx"
    ON "financeiro_transacoes"("vencimento");

CREATE INDEX IF NOT EXISTS "financeiro_transacoes_pessoa_id_idx"
    ON "financeiro_transacoes"("pessoa_id");
