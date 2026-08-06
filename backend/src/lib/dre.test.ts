import { describe, it, expect } from 'vitest';
import { montarDre } from './dre.js';

describe('montarDre', () => {
  it('aggregates orcado vs realizado', () => {
    const dre = montarDre({
      orcado: [
        { tipo: 'RECEITA', categoria: 'MENSALIDADE', centroCustoId: null, valor: 1000 },
        { tipo: 'DESPESA', categoria: 'INSUMOS_TERREIRO', centroCustoId: 1, valor: 200, centroNome: 'Geral' },
      ],
      realizado: [
        { tipo: 'RECEITA', categoria: 'MENSALIDADE', centroCustoId: null, valor: 800 },
        { tipo: 'DESPESA', categoria: 'INSUMOS_TERREIRO', centroCustoId: 1, valor: 250, centroNome: 'Geral' },
      ],
    });
    expect(dre.totais.receitasOrc).toBe(1000);
    expect(dre.totais.receitasReal).toBe(800);
    expect(dre.totais.despesasReal).toBe(250);
    expect(dre.totais.resultado).toBe(550);
    expect(dre.linhas.length).toBe(2);
  });
});
