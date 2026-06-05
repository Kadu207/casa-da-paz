import { describe, it, expect, afterEach } from 'vitest';
import { cloudflareImagesEnabled } from './cloudflare-images.js';

describe('cloudflareImagesEnabled', () => {
  const origAccount = process.env.CF_ACCOUNT_ID;
  const origToken = process.env.CF_IMAGES_API_TOKEN;

  afterEach(() => {
    process.env.CF_ACCOUNT_ID = origAccount;
    process.env.CF_IMAGES_API_TOKEN = origToken;
  });

  it('false sem variaveis', () => {
    delete process.env.CF_ACCOUNT_ID;
    delete process.env.CF_IMAGES_API_TOKEN;
    expect(cloudflareImagesEnabled()).toBe(false);
  });

  it('true com account e token', () => {
    process.env.CF_ACCOUNT_ID = 'acc';
    process.env.CF_IMAGES_API_TOKEN = 'tok';
    expect(cloudflareImagesEnabled()).toBe(true);
  });
});
