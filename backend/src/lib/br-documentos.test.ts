import { describe, expect, it } from 'vitest';
import { validarCpf, validarCnpj } from './br-documentos.js';

describe('br-documentos', () => {
  it('valida CPF conhecido', () => {
    expect(validarCpf('529.982.247-25')).toBe(true);
    expect(validarCpf('111.111.111-11')).toBe(false);
  });

  it('valida CNPJ conhecido', () => {
    expect(validarCnpj('04.252.011/0001-10')).toBe(true);
    expect(validarCnpj('00.000.000/0000-00')).toBe(false);
  });
});
