import { describe, expect, it } from 'vitest';
import { buildAlertasOrderBy, buildAlertasWhere } from './alertas-query.js';

describe('buildAlertasWhere', () => {
  it('filtra por tipo e disparado', () => {
    const where = buildAlertasWhere({
      tipo: 'MENSALIDADE_ATRASADA',
      disparado: false,
    });
    expect(where).toEqual({
      tipo: 'MENSALIDADE_ATRASADA',
      disparado: false,
    });
  });

  it('filtra por período createdAt', () => {
    const where = buildAlertasWhere({ de: '2026-06-01', ate: '2026-06-30' });
    expect(where.createdAt).toEqual({
      gte: new Date('2026-06-01T00:00:00'),
      lte: new Date('2026-06-30T23:59:59'),
    });
  });

  it('retorna where vazio sem filtros', () => {
    expect(buildAlertasWhere({})).toEqual({});
  });
});

describe('buildAlertasOrderBy', () => {
  it('ordena por campo e direção', () => {
    expect(buildAlertasOrderBy('tipo', 'asc')).toEqual({ tipo: 'asc' });
    expect(buildAlertasOrderBy('createdAt', 'desc')).toEqual({ createdAt: 'desc' });
  });
});
