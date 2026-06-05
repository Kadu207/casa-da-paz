-- Metricas eventos, newsletter, audit log, protocolo agendamento
ALTER TABLE "eventos" ADD COLUMN IF NOT EXISTS "visualizacoes" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "agendamentos_publicos" ADD COLUMN IF NOT EXISTS "protocolo" VARCHAR(32);

UPDATE "agendamentos_publicos"
SET "protocolo" = 'CDP-LEG-' || LPAD(id::text, 6, '0')
WHERE "protocolo" IS NULL;

ALTER TABLE "agendamentos_publicos" ALTER COLUMN "protocolo" SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "agendamentos_publicos_protocolo_key" ON "agendamentos_publicos"("protocolo");

CREATE TABLE IF NOT EXISTS "newsletter_inscritos" (
    "id" SERIAL NOT NULL,
    "email" VARCHAR(150) NOT NULL,
    "nome" VARCHAR(150),
    "locale" VARCHAR(10) NOT NULL DEFAULT 'pt-BR',
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "newsletter_inscritos_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "newsletter_inscritos_email_key" ON "newsletter_inscritos"("email");

CREATE TABLE IF NOT EXISTS "admin_audit_log" (
    "id" SERIAL NOT NULL,
    "usuario_id" INTEGER,
    "setor" VARCHAR(50),
    "rota" VARCHAR(120) NOT NULL,
    "motivo" TEXT,
    "ip" VARCHAR(45),
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "admin_audit_log_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "admin_audit_log_created_at_idx" ON "admin_audit_log"("created_at");
