import { describe, expect, it } from 'vitest';
import { perfilExigeResponsavel, validarResponsaveis } from './pessoa-responsaveis.js';

describe('pessoa-responsaveis', () => {
  it('exige responsável para consulente/médium menor', () => {
    expect(perfilExigeResponsavel('CONSULENTE', false)).toBe(true);
    expect(perfilExigeResponsavel('MEDIUM', false)).toBe(true);
    expect(perfilExigeResponsavel('CONSULENTE', true)).toBe(false);
    expect(perfilExigeResponsavel('DIRETORIA', false)).toBe(false);
  });

  it('valida lista mínima de responsáveis', () => {
    expect(validarResponsaveis('CONSULENTE', false, [])).toMatch(/responsável/);
    expect(
      validarResponsaveis('MEDIUM', false, [{ nomeCompleto: 'Maria Silva', telefone: '31999990000' }])
    ).toBeNull();
  });
});
