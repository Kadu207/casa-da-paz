export type AsaasEnv = 'sandbox' | 'production';

export function getAsaasConfig() {
  const env = (process.env.ASAAS_ENV ?? 'sandbox').toLowerCase() as AsaasEnv;
  const apiKey = process.env.ASAAS_API_KEY ?? '';
  const rawWebhook = process.env.ASAAS_WEBHOOK_TOKEN?.trim() ?? '';
  const isProd =
    process.env.NODE_ENV === 'production' || process.env.CASADAPAZ_ENV === 'production';
  // Em produção nunca aceitar default de desenvolvimento (fail-closed no validate).
  const webhookToken =
    rawWebhook && rawWebhook !== 'asaas-dev-webhook-token'
      ? rawWebhook
      : isProd
        ? ''
        : rawWebhook || 'asaas-dev-webhook-token';
  const walletId = process.env.ASAAS_WALLET_ID ?? '';
  const baseUrl =
    process.env.ASAAS_API_URL ??
    (env === 'production' ? 'https://api.asaas.com/v3' : 'https://sandbox.asaas.com/api/v3');

  return {
    env: env === 'production' ? 'production' : 'sandbox',
    apiKey,
    webhookToken,
    walletId,
    baseUrl,
    configured: Boolean(apiKey),
  };
}

export class AsaasApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public body?: unknown
  ) {
    super(message);
    this.name = 'AsaasApiError';
  }
}

export async function asaasFetch<T>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const cfg = getAsaasConfig();
  if (!cfg.apiKey) {
    throw new AsaasApiError('ASAAS_API_KEY não configurada', 503);
  }

  const res = await fetch(`${cfg.baseUrl}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      access_token: cfg.apiKey,
      ...(init.headers ?? {}),
    },
  });

  const text = await res.text();
  let body: unknown = null;
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
  }

  if (!res.ok) {
    const msg =
      typeof body === 'object' && body && 'errors' in body
        ? JSON.stringify((body as { errors: unknown }).errors)
        : `Asaas HTTP ${res.status}`;
    throw new AsaasApiError(msg, res.status, body);
  }

  return body as T;
}
