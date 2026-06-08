-- Registro de consentimento LGPD em formulários públicos
ALTER TABLE "agendamentos_publicos" ADD COLUMN IF NOT EXISTS "aceite_lgpd_em" TIMESTAMP(3);
ALTER TABLE "agendamentos_publicos" ADD COLUMN IF NOT EXISTS "aceite_lgpd_versao" VARCHAR(20);

ALTER TABLE "newsletter_inscritos" ADD COLUMN IF NOT EXISTS "aceite_lgpd_em" TIMESTAMP(3);
ALTER TABLE "newsletter_inscritos" ADD COLUMN IF NOT EXISTS "aceite_lgpd_versao" VARCHAR(20);

ALTER TABLE "ecommerce_pedidos" ADD COLUMN IF NOT EXISTS "aceite_lgpd_em" TIMESTAMP(3);
ALTER TABLE "ecommerce_pedidos" ADD COLUMN IF NOT EXISTS "aceite_lgpd_versao" VARCHAR(20);
