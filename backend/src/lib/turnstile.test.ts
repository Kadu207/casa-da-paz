import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { turnstileEnabled, turnstileSiteKey, verifyTurnstile } from './turnstile.js';

describe('turnstile', () => {
  const origSecret = process.env.TURNSTILE_SECRET_KEY;
  const origSite = process.env.TURNSTILE_SITE_KEY;

  afterEach(() => {
    process.env.TURNSTILE_SECRET_KEY = origSecret;
    process.env.TURNSTILE_SITE_KEY = origSite;
    vi.restoreAllMocks();
  });

  it('site key publica opcional', () => {
    delete process.env.TURNSTILE_SITE_KEY;
    expect(turnstileSiteKey()).toBeNull();
    process.env.TURNSTILE_SITE_KEY = ' 0xabc ';
    expect(turnstileSiteKey()).toBe('0xabc');
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
