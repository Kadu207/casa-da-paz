import type { Prisma } from '@prisma/client';
import { resolverPeriodo, type Periodo } from './fluxo-caixa.js';

export function parseMetricasPeriodo(query: {
  mes?: string;
  ano?: string;
}): Periodo | null | string {
  if (!query.mes && !query.ano) return null;
  const mes = query.mes ? Number(query.mes) : undefined;
  const ano = query.ano ? Number(query.ano) : undefined;
  const periodo = resolverPeriodo({ mes, ano });
  if (typeof periodo === 'string') return periodo;
  return periodo;
}

export function financeiroWhereNoPeriodo(periodo: Periodo): Prisma.FinanceiroTransacaoWhereInput {
  return {
    dataTransacao: { gte: periodo.de, lte: periodo.ate },
  };
}
