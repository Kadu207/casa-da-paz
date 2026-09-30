import { describe, expect, it, vi } from 'vitest';
import { isRetryableHttpStatus, withRetry } from './with-retry.js';

describe('withRetry', () => {
  it('reconhece HTTP transitório', () => {
    expect(isRetryableHttpStatus(429)).toBe(true);
    expect(isRetryableHttpStatus(503)).toBe(true);
    expect(isRetryableHttpStatus(400)).toBe(false);
  });

  it('repete e depois sucede', async () => {
    const fn = vi
      .fn<() => Promise<string>>()
      .mockRejectedValueOnce(new TypeError('fetch failed'))
      .mockResolvedValueOnce('ok');
    const result = await withRetry(fn, { attempts: 3, baseDelayMs: 1, sleep: async () => undefined });
    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('não repete quando retryOn é falso', async () => {
    const fn = vi.fn<() => Promise<string>>().mockRejectedValue(new Error('boom'));
    await expect(
      withRetry(fn, { attempts: 3, retryOn: () => false, sleep: async () => undefined })
    ).rejects.toThrow('boom');
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
