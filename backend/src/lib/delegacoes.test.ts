import { describe, expect, it } from 'vitest';
import { canAccess, defaultGrantsForSetor } from '../policies/rbac.js';
import { slugifyFuncao, inicioDoDia, amanhaUtc } from '../lib/delegacoes.js';

describe('RBAC delegacoes', () => {
  it('DIRETORIA/SUPERVISOR/ADMIN têm write', () => {
    expect(canAccess('DIRETORIA', 'delegacoes', 'write')).toBe(true);
    expect(canAccess('SUPERVISOR', 'delegacoes', 'write')).toBe(true);
    expect(canAccess('ADMIN', 'delegacoes', 'write')).toBe(true);
  });

  it('MEDIUM e setores operacionais têm read, não write', () => {
    expect(canAccess('MEDIUM', 'delegacoes', 'read')).toBe(true);
    expect(canAccess('MEDIUM', 'delegacoes', 'write')).toBe(false);
    expect(canAccess('FINANCEIRO', 'delegacoes', 'read')).toBe(true);
    expect(canAccess('FINANCEIRO', 'delegacoes', 'write')).toBe(false);
    expect(canAccess('RECEPCAO', 'delegacoes', 'read')).toBe(true);
    expect(canAccess('MARKETING', 'delegacoes', 'read')).toBe(true);
    expect(canAccess('SUPORTE', 'delegacoes', 'read')).toBe(true);
  });

  it('policy override concede write a MEDIUM', () => {
    expect(canAccess('MEDIUM', 'delegacoes', 'write', { delegacoes: 'write' })).toBe(true);
  });

  it('defaults do setor incluem delegacoes', () => {
    expect(defaultGrantsForSetor('DIRETORIA').delegacoes).toBe('write');
    expect(defaultGrantsForSetor('MEDIUM').delegacoes).toBe('read');
  });
});

describe('delegacoes helpers', () => {
  it('slugify remove acentos', () => {
    expect(slugifyFuncao('Eventos e agenda')).toBe('eventos-e-agenda');
    expect(slugifyFuncao('Manutenção')).toBe('manutencao');
  });

  it('inicioDoDia e amanhaUtc em UTC', () => {
    const d = new Date('2026-09-02T15:30:00.000Z');
    expect(inicioDoDia(d).toISOString()).toBe('2026-09-02T00:00:00.000Z');
    expect(amanhaUtc(d).toISOString()).toBe('2026-09-03T00:00:00.000Z');
  });
});
