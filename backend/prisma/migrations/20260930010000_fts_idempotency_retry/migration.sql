-- FTS português + dígitos de telefone para dedup indexado (sem ILIKE aberto).

ALTER TABLE "pessoas" ADD COLUMN IF NOT EXISTS "telefone_digitos" VARCHAR(20);

UPDATE "pessoas"
SET "telefone_digitos" = regexp_replace("telefone", '\D', '', 'g')
WHERE "telefone" IS NOT NULL
  AND ("telefone_digitos" IS NULL OR "telefone_digitos" = '');

CREATE INDEX IF NOT EXISTS "pessoas_telefone_digitos_idx" ON "pessoas" ("telefone_digitos");

ALTER TABLE "pessoas" ADD COLUMN IF NOT EXISTS "busca" tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('portuguese', coalesce("nome_completo", '')), 'A') ||
    setweight(to_tsvector('portuguese', coalesce("telefone", '')), 'B') ||
    setweight(to_tsvector('portuguese', coalesce("telefone_digitos", '')), 'B') ||
    setweight(to_tsvector('portuguese', coalesce("email", '')), 'C')
  ) STORED;

CREATE INDEX IF NOT EXISTS "pessoas_busca_gin" ON "pessoas" USING GIN ("busca");

ALTER TABLE "admin_audit_log" ADD COLUMN IF NOT EXISTS "busca" tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('portuguese', coalesce("motivo", '')), 'A') ||
    setweight(to_tsvector('portuguese', coalesce("rota", '')), 'A') ||
    setweight(to_tsvector('portuguese', coalesce("login", '')), 'B') ||
    setweight(to_tsvector('portuguese', coalesce("recurso", '')), 'B') ||
    setweight(to_tsvector('portuguese', coalesce("acao", '')), 'B') ||
    setweight(to_tsvector('portuguese', coalesce("ip", '')), 'C')
  ) STORED;

CREATE INDEX IF NOT EXISTS "admin_audit_log_busca_gin" ON "admin_audit_log" USING GIN ("busca");
