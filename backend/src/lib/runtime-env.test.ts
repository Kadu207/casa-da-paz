import { describe, expect, it } from 'vitest';
import { isDevDefaultSecret, timingSafeEqualString } from './runtime-env.js';

describe('runtime-env security helpers', () => {
  it('detecta defaults de desenvolvimento', () => {
    expect(isDevDefaultSecret('dev-secret-change-me')).toBe(true);
    expect(isDevDefaultSecret('pix-dev-secret')).toBe(true);
    expect(isDevDefaultSecret('asaas-dev-webhook-token')).toBe(true);
    expect(isDevDefaultSecret('forte-aleatorio-xyz')).toBe(false);
  });

  it('compara tokens de forma segura', () => {
    expect(timingSafeEqualString('abc', 'abc')).toBe(true);
    expect(timingSafeEqualString('abc', 'abd')).toBe(false);
    expect(timingSafeEqualString('abc', 'ab')).toBe(false);
  });
});
