import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { turnstileEnabled, verifyTurnstile } from './turnstile.js';

describe('turnstile', () => {
  const orig = process.env.TURNSTILE_SECRET_KEY;

  afterEach(() => {
    process.env.TURNSTILE_SECRET_KEY = orig;
    vi.restoreAllMocks();
  });

  it('desabilitado sem secret', async () => {
    delete process.env.TURNSTILE_SECRET_KEY;
    expect(turnstileEnabled()).toBe(false);
    await expect(verifyTurnstile(undefined)).resolves.toBe(true);
  });

  it('exige token quando habilitado', async () => {
    process.env.TURNSTILE_SECRET_KEY = 'test-secret';
    expect(turnstileEnabled()).toBe(true);
    await expect(verifyTurnstile('')).resolves.toBe(false);
  });

  it('valida token com Cloudflare', async () => {
    process.env.TURNSTILE_SECRET_KEY = 'test-secret';
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      })
    );
    await expect(verifyTurnstile('valid-token')).resolves.toBe(true);
  });
});
