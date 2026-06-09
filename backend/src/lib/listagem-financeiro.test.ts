import { describe, it, expect } from 'vitest';
import {
  parseListagemQuery,
  buildListagemWhere,
  whereAdimplencia,
  parsePaginacao,
  paginateMeta,
} from './listagem-financeiro.js';

describe('parseListagemQuery', () => {
  it('aceita filtros válidos', () => {
    const r = parseListagemQuery({
      de: '2026-06-01',
      ate: '2026-06-30',
      tipo: 'RECEITA',
      adimplencia: 'ATRASADO',
      pessoaId: '5',
    });
    expect(typeof r).not.toBe('string');
    if (typeof r === 'string') return;
    expect(r.tipo).toBe('RECEITA');
    expect(r.pessoaId).toBe(5);
  });

  it('rejeita tipo inválido', () => {
    expect(parseListagemQuery({ tipo: 'X' })).toBe('tipo inválido');
  });
});

describe('buildListagemWhere', () => {
  it('monta intervalo de datas', () => {
    const w = buildListagemWhere({ de: '2026-06-01', ate: '2026-06-15' });
    expect(typeof w).not.toBe('string');
    if (typeof w === 'string') return;
    expect(w.dataTransacao).toBeDefined();
  });

  it('combina adimplencia com AND', () => {
    const w = buildListagemWhere({ adimplencia: 'PAGO', tipo: 'RECEITA' });
    expect(typeof w).not.toBe('string');
    if (typeof w === 'string') return;
    expect(w.AND).toHaveLength(2);
  });

  it('rejeita de sem ate', () => {
    expect(buildListagemWhere({ de: '2026-06-01' })).toBe('Informe de e ate juntos');
  });
});

describe('whereAdimplencia', () => {
  const hoje = new Date(2026, 5, 8);

  it('PAGO exige CONCLUIDO', () => {
    expect(whereAdimplencia('PAGO', hoje)).toEqual({ status: 'CONCLUIDO' });
  });

  it('ATRASADO exige vencimento passado', () => {
    expect(whereAdimplencia('ATRASADO', hoje)).toMatchObject({ status: 'PENDENTE' });
  });
});

describe('parsePaginacao', () => {
  it('sem page retorna modo legado', () => {
    expect(parsePaginacao(undefined, undefined).paginated).toBe(false);
  });

  it('com page ativa paginação', () => {
    const p = parsePaginacao('2', '10');
    expect(p.paginated).toBe(true);
    expect(p.page).toBe(2);
    expect(p.limit).toBe(10);
  });

  it('limita max 100', () => {
    expect(parsePaginacao('1', '500').limit).toBe(100);
  });
});

describe('paginateMeta', () => {
  it('calcula totalPages', () => {
    expect(paginateMeta(125, 1, 50)).toEqual({
      page: 1,
      limit: 50,
      total: 125,
      totalPages: 3,
    });
  });

  it('total zero', () => {
    expect(paginateMeta(0, 1, 50).totalPages).toBe(0);
  });
});
