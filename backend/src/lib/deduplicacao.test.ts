import { describe, it, expect } from 'vitest';
import {
  normalizarTelefone,
  nomesSimilares,
  telefonesEquivalentes,
  detectarDuplicata,
} from './deduplicacao.js';

describe('deduplicacao', () => {
  it('normaliza telefone removendo máscara', () => {
    expect(normalizarTelefone('(31) 99999-1234')).toBe('31999991234');
  });

  it('detecta telefones equivalentes com DDD diferente no sufixo', () => {
    expect(telefonesEquivalentes('31999991234', '999991234')).toBe(true);
    expect(telefonesEquivalentes('31999991234', '21988887777')).toBe(false);
  });

  it('detecta nomes similares com acentos', () => {
    expect(nomesSimilares('João Silva', 'joao silva')).toBe(true);
    expect(nomesSimilares('Maria Santos', 'Pedro Lima')).toBe(false);
  });

  it('prioriza motivo telefone sobre nome', () => {
    const motivo = detectarDuplicata(
      { nomeCompleto: 'Ana Costa', telefone: '31999991234' },
      { nomeCompleto: 'Ana Costa', telefone: '(31) 99999-1234' }
    );
    expect(motivo).toBe('telefone');
  });
});
