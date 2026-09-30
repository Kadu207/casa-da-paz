import { isNetworkError, isRetryableHttpStatus, withRetry } from './with-retry.js';

export function cloudflareImagesEnabled(): boolean {
  return Boolean(process.env.CF_ACCOUNT_ID && process.env.CF_IMAGES_API_TOKEN);
}

export interface CfUploadResult {
  id: string;
  url: string;
  variants: string[];
}

export async function uploadToCloudflareImages(
  buffer: Buffer,
  filename: string,
  metadata?: Record<string, string>
): Promise<CfUploadResult> {
  const accountId = process.env.CF_ACCOUNT_ID ?? '';
  const token = process.env.CF_IMAGES_API_TOKEN ?? '';
  if (!accountId || !token) {
    throw new Error('Cloudflare Images não configurado (CF_ACCOUNT_ID / CF_IMAGES_API_TOKEN)');
  }

  const json = await withRetry(
    async () => {
      const form = new FormData();
      form.append('file', new Blob([new Uint8Array(buffer)]), filename);
      if (metadata) form.append('metadata', JSON.stringify(metadata));

      const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/images/v1`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      const body = (await res.json()) as {
        success?: boolean;
        errors?: { message: string }[];
        result?: { id: string; variants?: string[] };
      };
      if (!res.ok && isRetryableHttpStatus(res.status)) {
        throw new Error(`CF Images HTTP ${res.status}`);
      }
      if (!res.ok || !body.success || !body.result) {
        const msg = body.errors?.[0]?.message ?? `HTTP ${res.status}`;
        const err = new Error(`Upload CF Images falhou: ${msg}`);
        (err as Error & { retryable?: boolean }).retryable = false;
        throw err;
      }
      return body;
    },
    {
      attempts: 3,
      baseDelayMs: 250,
      retryOn: (err) => isNetworkError(err) || /CF Images HTTP/.test(String(err)),
    }
  );

  const variants = json.result?.variants ?? [];
  return {
    id: json.result!.id,
    url: variants[0] ?? '',
    variants,
  };
}
