import { createServerFn } from "@tanstack/react-start";

/**
 * Retorna a Cloudflare Turnstile site key para o cliente renderizar o widget.
 * A site key é pública (visível no HTML do widget), mas mantemos o valor
 * fora do bundle e injetado a partir do ambiente do servidor.
 */
export const getTurnstileSiteKey = createServerFn({ method: "GET" }).handler(
  async () => {
    return { siteKey: process.env.TURNSTILE_SITE_KEY ?? "" };
  },
);
