import { timingSafeEqual } from 'node:crypto';

const DEV_DEFAULTS = new Set([
  'dev-secret-change-me',
  'dev-secret',
  'changeme',
  'change-me-in-production',
  'asaas-dev-webhook-token',
  'pix-dev-secret',
  'n8n-dev-secret',
]);

/** Produção: NODE_ENV=production ou CASADAPAZ_ENV=production (compose). */
export function isProductionRuntime(): boolean {
  return (
    process.env.NODE_ENV === 'production' ||
    process.env.CASADAPAZ_ENV === 'production'
  );
}

export function isDevDefaultSecret(value: string): boolean {
  return DEV_DEFAULTS.has(value);
}

/**
 * Em produção: exige secret forte (sem fallback de dev).
 * Em desenvolvimento: permite fallback explícito.
 */
export function resolveSecret(envName: string, devFallback: string): string {
  const value = process.env[envName]?.trim() ?? '';
  if (isProductionRuntime()) {
    if (!value || isDevDefaultSecret(value)) {
      throw new Error(
        `[security] Defina ${envName} com valor forte em produção (não use default de desenvolvimento).`
      );
    }
    return value;
  }
  return value || devFallback;
}

/** Comparação constante no tempo (evita timing attacks em tokens). */
export function timingSafeEqualString(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}
