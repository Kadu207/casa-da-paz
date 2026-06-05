/**
 * Rate limiting em memória, por instância do servidor.
 *
 * Limitação conhecida: em ambientes serverless/edge com múltiplas instâncias
 * o limite é por instância, não global. Adequado como camada extra ao lado
 * de honeypot + Turnstile; para limite global precisaria de KV/Redis.
 */

type Bucket = { timestamps: number[] };

const buckets = new Map<string, Bucket>();

export type RateLimitResult = {
  ok: boolean;
  retryAfterSec?: number;
  remaining?: number;
};

export function rateLimit(
  key: string,
  opts: { windowMs: number; max: number },
): RateLimitResult {
  const now = Date.now();
  const bucket = buckets.get(key) ?? { timestamps: [] };
  // Remove timestamps fora da janela
  bucket.timestamps = bucket.timestamps.filter(
    (t) => now - t < opts.windowMs,
  );

  if (bucket.timestamps.length >= opts.max) {
    const oldest = bucket.timestamps[0];
    const retryAfterMs = opts.windowMs - (now - oldest);
    buckets.set(key, bucket);
    return {
      ok: false,
      retryAfterSec: Math.max(1, Math.ceil(retryAfterMs / 1000)),
      remaining: 0,
    };
  }

  bucket.timestamps.push(now);
  buckets.set(key, bucket);

  // Limpeza oportunista
  if (buckets.size > 5000) {
    for (const [k, b] of buckets) {
      if (b.timestamps.every((t) => now - t > opts.windowMs)) {
        buckets.delete(k);
      }
    }
  }

  return { ok: true, remaining: opts.max - bucket.timestamps.length };
}
