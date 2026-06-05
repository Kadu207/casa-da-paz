-- Renomeia identificador de login: e-mail → usuário (sem @)
ALTER TABLE "usuarios" RENAME COLUMN "email" TO "login";

-- Migra contas de dev existentes
UPDATE "usuarios" SET "login" = 'admin' WHERE "login" = 'admin@casadapaz.local';
UPDATE "usuarios" SET "login" = 'medium' WHERE "login" = 'medium@casadapaz.local';

-- Ajusta tamanho da coluna
ALTER TABLE "usuarios" ALTER COLUMN "login" TYPE VARCHAR(50);
