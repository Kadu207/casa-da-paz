import { describe, it, expect } from 'vitest';
import { eventoLotado, podeInscrever } from './inscricoes.js';

describe('inscricoes', () => {
  it('detecta lotação esgotada', () => {
    expect(eventoLotado(10, 10)).toBe(true);
    expect(eventoLotado(10, 9)).toBe(false);
    expect(eventoLotado(null, 100)).toBe(false);
  });

  it('bloqueia inscrição duplicada', () => {
    expect(
      podeInscrever({
        eventoStatus: 'ABERTO',
        capacidadeMax: 20,
        inscricoesAtivas: 5,
        jaInscrito: true,
      })
    ).toBe('Pessoa já inscrita neste evento');
  });

  it('permite inscrição válida', () => {
    expect(
      podeInscrever({
        eventoStatus: 'ABERTO',
        capacidadeMax: 20,
        inscricoesAtivas: 5,
        jaInscrito: false,
      })
    ).toBeNull();
  });
});
