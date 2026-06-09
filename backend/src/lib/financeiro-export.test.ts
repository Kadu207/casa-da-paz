import { describe, expect, it } from 'vitest';
import { buildFinanceiroCsv, formatCsvRow } from './financeiro-export.js';
import { gerarPdfFinanceiro } from './financeiro-pdf.js';

const sample = {
  id: 3,
  tipo: 'RECEITA' as const,
  categoria: 'DOACAO',
  valor: 50,
  dataTransacao: new Date('2026-06-06T00:00:00.000Z'),
  vencimento: null,
  status: 'CONCLUIDO' as const,
  observacoes: null,
  pessoaNome: 'Maria Silva',
};

describe('formatCsvRow', () => {
  it('inclui colunas do contrato', () => {
    const row = formatCsvRow(sample);
    expect(row).toContain('3,RECEITA,DOACAO,50.00');
    expect(row).toContain('PAGO');
    expect(row).toContain('Maria Silva');
  });
});

describe('buildFinanceiroCsv', () => {
  it('inclui header e linhas', () => {
    const csv = buildFinanceiroCsv([sample]);
    expect(csv.startsWith('id,tipo,categoria')).toBe(true);
    expect(csv).toContain('DOACAO');
  });
});

describe('gerarPdfFinanceiro', () => {
  it('retorna buffer PDF', async () => {
    const buf = await gerarPdfFinanceiro([sample], '2026-06');
    expect(buf.length).toBeGreaterThan(100);
    expect(buf.subarray(0, 4).toString()).toBe('%PDF');
  });
});
