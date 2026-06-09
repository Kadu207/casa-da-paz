import type { StatusTransacao, TipoTransacao } from '@prisma/client';
import { calcularAdimplencia } from './adimplencia.js';

export interface Periodo {
  de: Date;
  ate: Date;
}

export interface TransacaoFluxo {
  tipo: TipoTransacao;
  categoria: string;
  valor: number;
  status: StatusTransacao;
  dataTransacao: Date;
  vencimento: Date | null;
}

export interface SemanaFluxo {
  semana: string;
  receitas: number;
  despesas: number;
  saldoAcumulado: number;
}

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

function parseIsoDate(value: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

/** ISO week label e.g. 2026-W23 */
export function semanaIso(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

export function resolverPeriodo(input: {
  de?: string;
  ate?: string;
  mes?: number;
  ano?: number;
}): Periodo | string {
  if (input.mes !== undefined || input.ano !== undefined) {
    if (input.mes === undefined || input.ano === undefined) {
      return 'Informe mes e ano juntos';
    }
    if (input.mes < 1 || input.mes > 12) {
      return 'Mês inválido';
    }
    if (input.de || input.ate) {
      return 'Use mes/ano ou de/ate, não ambos';
    }
    const de = new Date(input.ano, input.mes - 1, 1);
    const ate = new Date(input.ano, input.mes, 0);
    return { de: startOfDay(de), ate: endOfDay(ate) };
  }

  if (!input.de || !input.ate) {
    return 'Informe de e ate (ISO date) ou mes e ano';
  }

  const de = parseIsoDate(input.de);
  const ate = parseIsoDate(input.ate);
  if (!de || !ate) {
    return 'Datas inválidas; use formato YYYY-MM-DD';
  }
  if (de > ate) {
    return 'de não pode ser posterior a ate';
  }

  return { de: startOfDay(de), ate: endOfDay(ate) };
}

export function calcularTotaisConcluidos(transacoes: TransacaoFluxo[]) {
  let receitasConcluidas = 0;
  let despesasConcluidas = 0;

  for (const t of transacoes) {
    if (t.status !== 'CONCLUIDO') continue;
    if (t.tipo === 'RECEITA') receitasConcluidas += t.valor;
    else despesasConcluidas += t.valor;
  }

  return {
    receitasConcluidas,
    despesasConcluidas,
    saldo: receitasConcluidas - despesasConcluidas,
  };
}

export function calcularTotaisPendentes(
  transacoes: TransacaoFluxo[],
  hoje: Date = new Date()
) {
  let pendentesValor = 0;
  let pendentesQtd = 0;
  let atrasadosValor = 0;
  let atrasadosQtd = 0;

  for (const t of transacoes) {
    if (t.status !== 'PENDENTE') continue;
    pendentesQtd += 1;
    pendentesValor += t.valor;
    if (calcularAdimplencia(t.status, t.vencimento, hoje) === 'ATRASADO') {
      atrasadosQtd += 1;
      atrasadosValor += t.valor;
    }
  }

  return { pendentesValor, pendentesQtd, atrasadosValor, atrasadosQtd };
}

export function agruparPorCategoria(transacoes: TransacaoFluxo[]) {
  const receitas = new Map<string, number>();
  const despesas = new Map<string, number>();

  for (const t of transacoes) {
    if (t.status !== 'CONCLUIDO') continue;
    const map = t.tipo === 'RECEITA' ? receitas : despesas;
    map.set(t.categoria, (map.get(t.categoria) ?? 0) + t.valor);
  }

  const toArr = (m: Map<string, number>) =>
    [...m.entries()]
      .map(([categoria, valor]) => ({ categoria, valor }))
      .sort((a, b) => b.valor - a.valor);

  return {
    receitas: toArr(receitas),
    despesas: toArr(despesas),
  };
}

export function agruparPorSemana(
  transacoes: TransacaoFluxo[],
  periodo: Periodo
): SemanaFluxo[] {
  const buckets = new Map<string, { receitas: number; despesas: number }>();

  for (const t of transacoes) {
    if (t.status !== 'CONCLUIDO') continue;
    const dt = startOfDay(t.dataTransacao);
    if (dt < periodo.de || dt > periodo.ate) continue;

    const key = semanaIso(dt);
    const bucket = buckets.get(key) ?? { receitas: 0, despesas: 0 };
    if (t.tipo === 'RECEITA') bucket.receitas += t.valor;
    else bucket.despesas += t.valor;
    buckets.set(key, bucket);
  }

  const sorted = [...buckets.entries()].sort(([a], [b]) => a.localeCompare(b));
  let acumulado = 0;
  return sorted.map(([semana, { receitas, despesas }]) => {
    acumulado += receitas - despesas;
    return { semana, receitas, despesas, saldoAcumulado: acumulado };
  });
}
