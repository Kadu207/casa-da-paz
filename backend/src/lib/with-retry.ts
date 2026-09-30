export function isRetryableHttpStatus(status: number): boolean {
  return status === 408 || status === 429 || status === 500 || status === 502 || status === 503 || status === 504;
}

export function isNetworkError(err: unknown): boolean {
  if (err instanceof TypeError) return true;
  if (!(err instanceof Error)) return false;
  return /fetch failed|ECONNRESET|ETIMEDOUT|ENOTFOUND|network|socket/i.test(err.message);
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: {
    attempts?: number;
    baseDelayMs?: number;
    retryOn?: (err: unknown) => boolean;
    sleep?: (ms: number) => Promise<void>;
  } = {}
): Promise<T> {
  const attempts = options.attempts ?? 3;
  const baseDelayMs = options.baseDelayMs ?? 200;
  const sleep = options.sleep ?? ((ms: number) => new Promise((r) => setTimeout(r, ms)));
  const retryOn = options.retryOn ?? isNetworkError;

  let last: unknown;
  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      last = err;
      if (!retryOn(err) || attempt === attempts - 1) throw err;
      const jitter = Math.floor(Math.random() * 40);
      await sleep(baseDelayMs * 2 ** attempt + jitter);
    }
  }
  throw last;
}
