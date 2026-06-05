import { describe, it, expect } from 'vitest';

export function podeCheckin(input: {
  eventoStatus: 'ABERTO' | 'ENCERRADO';
  presencasCount: number;
  capacidadeMax: number | null;
  jaPresente: boolean;
}): string | null {
  if (input.eventoStatus !== 'ABERTO') return 'Evento encerrado';
  if (input.jaPresente) return 'Pessoa já fez check-in neste evento';
  if (input.capacidadeMax && input.presencasCount >= input.capacidadeMax) {
    return 'Capacidade máxima atingida';
  }
  return null;
}

describe('podeCheckin', () => {
  it('bloqueia evento encerrado', () => {
    expect(
      podeCheckin({ eventoStatus: 'ENCERRADO', presencasCount: 0, capacidadeMax: 50, jaPresente: false })
    ).toBe('Evento encerrado');
  });

  it('bloqueia duplicata', () => {
    expect(
      podeCheckin({ eventoStatus: 'ABERTO', presencasCount: 1, capacidadeMax: 50, jaPresente: true })
    ).toBe('Pessoa já fez check-in neste evento');
  });

  it('bloqueia capacidade', () => {
    expect(
      podeCheckin({ eventoStatus: 'ABERTO', presencasCount: 50, capacidadeMax: 50, jaPresente: false })
    ).toBe('Capacidade máxima atingida');
  });

  it('permite check-in válido', () => {
    expect(
      podeCheckin({ eventoStatus: 'ABERTO', presencasCount: 10, capacidadeMax: 50, jaPresente: false })
    ).toBeNull();
  });
});
