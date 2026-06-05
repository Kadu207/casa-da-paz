import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { verifyTurnstile } from "@/lib/turnstile.server";
import { rateLimit } from "@/lib/rate-limit.server";

const bodySchema = z.object({
  nome: z
    .string()
    .trim()
    .min(2)
    .max(120)
    .regex(/^[\p{L}\s'.-]+$/u),
  telefone: z
    .string()
    .trim()
    .min(10)
    .max(20)
    .regex(/^[0-9()+\-\s]+$/),
  dataPreferida: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/),
  observacao: z.string().trim().max(500).optional().or(z.literal("")),
  website: z.string().max(0).optional().or(z.literal("")),
  turnstileToken: z.string().min(10).max(4096),
});

function gerarProtocolo() {
  const ts = Date.now().toString(36).toUpperCase();
  const rnd = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `CDP-${ts}-${rnd}`;
}

function getClientIp(request: Request): string {
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return (
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-real-ip") ??
    "unknown"
  );
}

export const Route = createFileRoute("/api/public/agendamentos")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const ip = getClientIp(request);

        // Rate limit por IP: 3 envios/min e 15/hora
        const rlMinute = rateLimit(`agendar:min:${ip}`, {
          windowMs: 60_000,
          max: 3,
        });
        if (!rlMinute.ok) {
          return new Response(
            JSON.stringify({
              error: "rate_limited",
              message: "Muitas tentativas. Aguarde alguns instantes.",
              retryAfterSec: rlMinute.retryAfterSec,
            }),
            {
              status: 429,
              headers: {
                "Content-Type": "application/json",
                "Retry-After": String(rlMinute.retryAfterSec ?? 60),
              },
            },
          );
        }
        const rlHour = rateLimit(`agendar:hour:${ip}`, {
          windowMs: 60 * 60_000,
          max: 15,
        });
        if (!rlHour.ok) {
          return new Response(
            JSON.stringify({
              error: "rate_limited",
              message:
                "Limite por hora atingido. Tente mais tarde ou fale conosco pelo WhatsApp.",
              retryAfterSec: rlHour.retryAfterSec,
            }),
            {
              status: 429,
              headers: {
                "Content-Type": "application/json",
                "Retry-After": String(rlHour.retryAfterSec ?? 3600),
              },
            },
          );
        }

        let payload: unknown;
        try {
          payload = await request.json();
        } catch {
          return Response.json(
            { error: "invalid_json" },
            { status: 400 },
          );
        }

        const parsed = bodySchema.safeParse(payload);
        if (!parsed.success) {
          return Response.json(
            {
              error: "validation_failed",
              issues: parsed.error.flatten(),
            },
            { status: 400 },
          );
        }
        const data = parsed.data;

        // Honeypot
        if (data.website && data.website.length > 0) {
          // Finge sucesso para não dar pista ao bot
          return Response.json({ protocolo: gerarProtocolo() }, { status: 200 });
        }

        // Verifica Turnstile
        const ts = await verifyTurnstile(data.turnstileToken, ip);
        if (!ts.success) {
          return Response.json(
            {
              error: "captcha_failed",
              message:
                "Verificação anti-spam falhou. Recarregue a página e tente novamente.",
            },
            { status: 400 },
          );
        }

        // Persistência real entra aqui (banco de dados).
        // Por enquanto, apenas geramos o protocolo e logamos.
        const protocolo = gerarProtocolo();
        console.log("[agendamento]", {
          protocolo,
          ip,
          nome: data.nome,
          telefone: data.telefone,
          dataPreferida: data.dataPreferida,
        });

        return Response.json({ protocolo }, { status: 200 });
      },
    },
  },
});
