import { afterEach, describe, expect, it } from 'vitest';
import {
  isDevDefaultSecret,
  isProductionRuntime,
  resolveSecret,
  timingSafeEqualString,
} from './runtime-env.js';

const ENV_KEYS = ['NODE_ENV', 'CASADAPAZ_ENV', 'JWT_SECRET', 'CORS_ORIGIN'] as const;

function snapshotEnv(): Record<string, string | undefined> {
  const out: Record<string, string | undefined> = {};
  for (const k of ENV_KEYS) out[k] = process.env[k];
  return out;
}

function restoreEnv(snap: Record<string, string | undefined>): void {
  for (const k of ENV_KEYS) {
    if (snap[k] === undefined) delete process.env[k];
    else process.env[k] = snap[k];
  }
}

describe('runtime-env security helpers', () => {
  const snap = snapshotEnv();
  afterEach(() => restoreEnv(snap));

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

  it('resolveSecret em dev aceita fallback', () => {
    delete process.env.NODE_ENV;
    delete process.env.CASADAPAZ_ENV;
    delete process.env.JWT_SECRET;
    expect(resolveSecret('JWT_SECRET', 'dev-secret-change-me')).toBe('dev-secret-change-me');
  });

  it('resolveSecret em produção rejeita ausente e default de dev', () => {
    process.env.CASADAPAZ_ENV = 'production';
    delete process.env.JWT_SECRET;
    expect(() => resolveSecret('JWT_SECRET', 'dev-secret-change-me')).toThrow(/JWT_SECRET/);
    process.env.JWT_SECRET = 'dev-secret-change-me';
    expect(() => resolveSecret('JWT_SECRET', 'dev-secret-change-me')).toThrow(/JWT_SECRET/);
    process.env.JWT_SECRET = 'prod-forte-nao-default-xyz';
    expect(resolveSecret('JWT_SECRET', 'dev-secret-change-me')).toBe('prod-forte-nao-default-xyz');
  });

  it('isProductionRuntime reconhece NODE_ENV e CASADAPAZ_ENV', () => {
    delete process.env.NODE_ENV;
    delete process.env.CASADAPAZ_ENV;
    expect(isProductionRuntime()).toBe(false);
    process.env.NODE_ENV = 'production';
    expect(isProductionRuntime()).toBe(true);
    delete process.env.NODE_ENV;
    process.env.CASADAPAZ_ENV = 'production';
    expect(isProductionRuntime()).toBe(true);
  });
});
