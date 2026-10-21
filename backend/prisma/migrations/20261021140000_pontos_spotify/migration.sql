-- CreateTable
CREATE TABLE "casa_portal_config" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "playlist_titulo" VARCHAR(150) NOT NULL DEFAULT 'Pontos da Casa',
    "playlist_url" VARCHAR(500),
    "telegram_url" VARCHAR(200),
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "casa_portal_config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pontos_cantados" (
    "id" SERIAL NOT NULL,
    "titulo" VARCHAR(150) NOT NULL,
    "linha" VARCHAR(80) NOT NULL,
    "letra" TEXT,
    "spotify_url" VARCHAR(500) NOT NULL,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "publicado" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pontos_cantados_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "pontos_cantados_publicado_ordem_idx" ON "pontos_cantados"("publicado", "ordem");
