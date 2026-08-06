import { describe, expect, it } from 'vitest';
import { defaultGrantsForSetor, snapshotGrantsForSetor } from '../policies/rbac.js';

describe('snapshotGrantsForSetor', () => {
  it('congela defaults do setor no ato do cadastro', () => {
    const snap = snapshotGrantsForSetor('RECEPCAO');
    expect(snap).toEqual(defaultGrantsForSetor('RECEPCAO'));
    expect(snap.pessoas).toBe('write');
    expect(snap.financeiro).toBeUndefined();
  });

  it('aplica overrides sobre o padrão do setor', () => {
    const snap = snapshotGrantsForSetor('FINANCEIRO', {
      pessoas: 'write',
      dashboard: 'none',
    });
    expect(snap.pessoas).toBe('write');
    expect(snap.dashboard).toBe('none');
    expect(snap.financeiro).toBe('write');
    expect(snap.contribuintes).toBe('write');
  });
});
