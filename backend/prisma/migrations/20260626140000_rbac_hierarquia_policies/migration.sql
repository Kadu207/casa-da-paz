-- RBAC hierárquico: SUPERVISOR + ADMIN + políticas por usuário
ALTER TYPE "SetorAcesso" ADD VALUE IF NOT EXISTS 'SUPERVISOR';
ALTER TYPE "SetorAcesso" ADD VALUE IF NOT EXISTS 'ADMIN';

CREATE TABLE IF NOT EXISTS "usuario_policies" (
    "id" SERIAL NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "grants" JSONB NOT NULL DEFAULT '{}',
    "atualizado_por_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usuario_policies_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "usuario_policies_usuario_id_key" ON "usuario_policies"("usuario_id");

ALTER TABLE "usuario_policies" DROP CONSTRAINT IF EXISTS "usuario_policies_usuario_id_fkey";
ALTER TABLE "usuario_policies" ADD CONSTRAINT "usuario_policies_usuario_id_fkey"
  FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
