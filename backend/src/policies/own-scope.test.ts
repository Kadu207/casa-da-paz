import { describe, expect, it } from 'vitest';
import { effectiveGrant, isOwnScope, snapshotGrantsForSetor } from '../policies/rbac.js';

describe('isOwnScope / effectiveGrant', () => {
  it('MEDIUM tem own em dashboard e financeiro por default', () => {
    expect(isOwnScope('MEDIUM', 'dashboard')).toBe(true);
    expect(isOwnScope('MEDIUM', 'financeiro')).toBe(true);
    expect(isOwnScope('MEDIUM', 'cobrancas')).toBe(true);
    expect(effectiveGrant('MEDIUM', 'dashboard')).toBe('own');
  });

  it('FINANCEIRO tem read/write, não own', () => {
    expect(isOwnScope('FINANCEIRO', 'dashboard')).toBe(false);
    expect(isOwnScope('FINANCEIRO', 'financeiro')).toBe(false);
    expect(effectiveGrant('FINANCEIRO', 'financeiro')).toBe('write');
  });

  it('override de policy pode forçar own sem setor MEDIUM', () => {
    const policies = snapshotGrantsForSetor('RECEPCAO', { financeiro: 'own', dashboard: 'own' });
    expect(isOwnScope('RECEPCAO', 'financeiro', policies)).toBe(true);
    expect(isOwnScope('RECEPCAO', 'dashboard', policies)).toBe(true);
    expect(isOwnScope('RECEPCAO', 'financeiro')).toBe(false);
  });
});
