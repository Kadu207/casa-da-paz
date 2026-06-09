import { describe, expect, it } from 'vitest';
import { financeiroWhereNoPeriodo, parseMetricasPeriodo } from './metricas-periodo.js';

describe('parseMetricasPeriodo', () => {
  it('retorna null sem filtro', () => {
    expect(parseMetricasPeriodo({})).toBeNull();
  });

  it('resolve mes e ano', () => {
    const p = parseMetricasPeriodo({ mes: '6', ano: '2026' });
    expect(typeof p).toBe('object');
    if (p && typeof p !== 'string') {
      expect(p.de.getMonth()).toBe(5);
    }
  });

  it('erro se mes inválido', () => {
    expect(parseMetricasPeriodo({ mes: '13', ano: '2026' })).toBe('Mês inválido');
  });
});

describe('financeiroWhereNoPeriodo', () => {
  it('filtra dataTransacao no intervalo', () => {
    const periodo = {
      de: new Date(2026, 5, 1),
      ate: new Date(2026, 5, 30, 23, 59, 59, 999),
    };
    const where = financeiroWhereNoPeriodo(periodo);
    expect(where.dataTransacao).toBeDefined();
  });
});
