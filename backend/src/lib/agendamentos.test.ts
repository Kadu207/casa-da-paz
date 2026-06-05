import { describe, it, expect } from 'vitest';
import { podeConfirmarAgendamento } from './agendamentos.js';

describe('podeConfirmarAgendamento', () => {
  it('bloqueia confirmar se já confirmado', () => {
    expect(podeConfirmarAgendamento('CONFIRMADO')).toBe('Agendamento já confirmado');
  });

  it('bloqueia confirmar se cancelado', () => {
    expect(podeConfirmarAgendamento('CANCELADO')).toBe('Agendamento cancelado');
  });

  it('permite pendente', () => {
    expect(podeConfirmarAgendamento('PENDENTE')).toBeNull();
  });
});
