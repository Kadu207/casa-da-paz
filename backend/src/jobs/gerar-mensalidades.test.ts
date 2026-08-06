import { describe, it, expect } from 'vitest';

/** Pure helper mirroring job month window logic for unit test without DB. */
function monthWindow(ref: Date) {
  const ano = ref.getFullYear();
  const mes = ref.getMonth();
  const dia = 10;
  return {
    inicio: new Date(Date.UTC(ano, mes, 1)),
    fim: new Date(Date.UTC(ano, mes + 1, 0)),
    vencimento: new Date(Date.UTC(ano, mes, dia)),
  };
}

describe('recorrencia month window', () => {
  it('builds August 2026 window', () => {
    const w = monthWindow(new Date('2026-08-15T12:00:00Z'));
    expect(w.inicio.toISOString().slice(0, 10)).toBe('2026-08-01');
    expect(w.fim.toISOString().slice(0, 10)).toBe('2026-08-31');
    expect(w.vencimento.toISOString().slice(0, 10)).toBe('2026-08-10');
  });
});
