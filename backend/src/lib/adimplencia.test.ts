import { describe, it, expect } from 'vitest';
import { calcularAdimplencia } from './adimplencia.js';

describe('calcularAdimplencia', () => {
  it('retorna PAGO quando CONCLUIDO', () => {
    expect(calcularAdimplencia('CONCLUIDO', new Date('2020-01-01'))).toBe('PAGO');
  });

  it('retorna ATRASADO quando vencido', () => {
    expect(
      calcularAdimplencia('PENDENTE', new Date('2020-01-01'), new Date('2026-06-05'))
    ).toBe('ATRASADO');
  });

  it('retorna EM_DIA quando dentro do prazo', () => {
    expect(
      calcularAdimplencia('PENDENTE', new Date('2027-01-01'), new Date('2026-06-05'))
    ).toBe('EM_DIA');
  });
});
