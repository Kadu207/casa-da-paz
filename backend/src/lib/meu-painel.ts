import { calcularAdimplencia } from './adimplencia.js';
import { buildHistoricoResumo } from './historico-pessoa.js';
import type { StatusTransacao } from '@prisma/client';

export function mapTransacaoAdimplencia<T extends { status: StatusTransacao; vencimento: Date | null }>(
  t: T
): T & { adimplencia: ReturnType<typeof calcularAdimplencia> } {
  return { ...t, adimplencia: calcularAdimplencia(t.status, t.vencimento) };
}

export function buildMeuPainelFinanceiro(
  transacoes: {
    id: number;
    categoria: string;
    valor: unknown;
    status: StatusTransacao;
    vencimento: Date | null;
    dataTransacao: Date;
  }[]
) {
  const resumo = buildHistoricoResumo(
    transacoes.map((t) => ({
      status: t.status,
      vencimento: t.vencimento,
      valor: Number(t.valor),
    }))
  );

  const mensalidades = transacoes
    .filter((t) => t.categoria === 'MENSALIDADE')
    .slice(0, 24)
    .map((t) => {
      const mapped = mapTransacaoAdimplencia(t);
      return {
        id: mapped.id,
        valor: Number(mapped.valor),
        status: mapped.status,
        adimplencia: mapped.adimplencia,
        vencimento: mapped.vencimento?.toISOString().slice(0, 10) ?? null,
        dataTransacao: mapped.dataTransacao.toISOString().slice(0, 10),
      };
    });

  return { resumo, mensalidades };
}
