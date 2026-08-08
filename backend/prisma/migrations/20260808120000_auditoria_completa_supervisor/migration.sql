-- AlterTable AdminAuditLog — auditoria completa (028)
ALTER TABLE "admin_audit_log" ADD COLUMN IF NOT EXISTS "login" VARCHAR(50);
ALTER TABLE "admin_audit_log" ADD COLUMN IF NOT EXISTS "metodo" VARCHAR(10);
ALTER TABLE "admin_audit_log" ADD COLUMN IF NOT EXISTS "recurso" VARCHAR(60);
ALTER TABLE "admin_audit_log" ADD COLUMN IF NOT EXISTS "acao" VARCHAR(40);
ALTER TABLE "admin_audit_log" ADD COLUMN IF NOT EXISTS "entidade_tipo" VARCHAR(60);
ALTER TABLE "admin_audit_log" ADD COLUMN IF NOT EXISTS "entidade_id" VARCHAR(80);
ALTER TABLE "admin_audit_log" ADD COLUMN IF NOT EXISTS "status_http" INTEGER;
ALTER TABLE "admin_audit_log" ADD COLUMN IF NOT EXISTS "sucesso" BOOLEAN DEFAULT true;
ALTER TABLE "admin_audit_log" ADD COLUMN IF NOT EXISTS "detalhe" JSONB;

CREATE INDEX IF NOT EXISTS "admin_audit_log_usuario_id_created_at_idx" ON "admin_audit_log"("usuario_id", "created_at");
CREATE INDEX IF NOT EXISTS "admin_audit_log_recurso_created_at_idx" ON "admin_audit_log"("recurso", "created_at");
CREATE INDEX IF NOT EXISTS "admin_audit_log_sucesso_created_at_idx" ON "admin_audit_log"("sucesso", "created_at");
