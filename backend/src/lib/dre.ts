import type { TipoTransacao } from '@prisma/client';

export interface DreLinha {
  categoria: string;
  centroCustoId: number | null;
  centroNome: string | null;
  tipo: TipoTransacao;
  orcado: number;
  realizado: number;
  variacao: number;
}

export function montarDre(opts: {
  orcado: { categoria: string; centroCustoId: number | null; tipo: TipoTransacao; valor: number; centroNome?: string | null }[];
  realizado: { categoria: string; centroCustoId: number | null; tipo: TipoTransacao; valor: number; centroNome?: string | null }[];
}): { linhas: DreLinha[]; totais: { receitasOrc: number; receitasReal: number; despesasOrc: number; despesasReal: number; resultado: number } } {
  const key = (t: TipoTransacao, cat: string, cc: number | null) => `${t}|${cat}|${cc ?? 0}`;
  const map = new Map<string, DreLinha>();

  for (const o of opts.orcado) {
    const k = key(o.tipo, o.categoria, o.centroCustoId);
    map.set(k, {
      categoria: o.categoria,
      centroCustoId: o.centroCustoId,
      centroNome: o.centroNome ?? null,
      tipo: o.tipo,
      orcado: o.valor,
      realizado: 0,
      variacao: -o.valor,
    });
  }
  for (const r of opts.realizado) {
    const k = key(r.tipo, r.categoria, r.centroCustoId);
    const cur = map.get(k) ?? {
      categoria: r.categoria,
      centroCustoId: r.centroCustoId,
      centroNome: r.centroNome ?? null,
      tipo: r.tipo,
      orcado: 0,
      realizado: 0,
      variacao: 0,
    };
    cur.realizado += r.valor;
    cur.variacao = cur.realizado - cur.orcado;
    map.set(k, cur);
  }

  const linhas = [...map.values()].sort((a, b) => a.tipo.localeCompare(b.tipo) || a.categoria.localeCompare(b.categoria));
  let receitasOrc = 0;
  let receitasReal = 0;
  let despesasOrc = 0;
  let despesasReal = 0;
  for (const l of linhas) {
    if (l.tipo === 'RECEITA') {
      receitasOrc += l.orcado;
      receitasReal += l.realizado;
    } else {
      despesasOrc += l.orcado;
      despesasReal += l.realizado;
    }
  }

  return {
    linhas,
    totais: {
      receitasOrc,
      receitasReal,
      despesasOrc,
      despesasReal,
      resultado: receitasReal - despesasReal,
    },
  };
}
