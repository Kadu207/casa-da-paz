import { describe, it, expect } from 'vitest';
import { validarTransacao } from './financeiro.js';

describe('validarTransacao', () => {
  it('exige vencimento em mensalidade', () => {
    expect(
      validarTransacao({
        tipo: 'RECEITA',
        categoria: 'MENSALIDADE',
        pessoaId: 1,
      })
    ).toBe('Vencimento obrigatório para esta categoria (ADR-003)');
  });

  it('exige pessoaId em mensalidade', () => {
    expect(
      validarTransacao({
        tipo: 'RECEITA',
        categoria: 'MENSALIDADE',
        vencimento: '2026-06-01',
      })
    ).toBe('pessoaId obrigatório para mensalidade');
  });

  it('aceita doação sem vencimento', () => {
    expect(
      validarTransacao({
        tipo: 'RECEITA',
        categoria: 'DOACAO',
      })
    ).toBeNull();
  });

  it('rejeita categoria inválida', () => {
    expect(
      validarTransacao({
        tipo: 'DESPESA',
        categoria: 'MENSALIDADE',
      })
    ).toBe('Categoria inválida para DESPESA');
  });
});
