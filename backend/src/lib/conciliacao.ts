import { calcularAdimplencia } from './adimplencia.js';
import type { Periodo } from './fluxo-caixa.js';
import { calcularTotaisConcluidos } from './fluxo-caixa.js';
import type { StatusTransacao, TipoTransacao } from '@prisma/client';

export interface TransacaoConciliacao {
  tipo: TipoTransacao;
  categoria: string;
  status: StatusTransacao;
  dataTransacao: Date;
  vencimento: Date | null;
  valor: number;
}

export interface ConciliacaoChecklist {
  mensalidadesPendentes: number;
  atrasados: number;
  despesasNoMes: number;
}

export interface ConciliacaoTotais {
  receitas: number;
  despesas: number;
  saldo: number;
}

function inPeriodo(dt: Date, periodo: Periodo): boolean {
  return dt >= periodo.de && dt <= periodo.ate;
}

export function buildConciliacaoChecklist(
  transacoes: TransacaoConciliacao[],
  periodo: Periodo,
  hoje: Date = new Date()
): ConciliacaoChecklist {
  let mensalidadesPendentes = 0;
  let atrasados = 0;
  let despesasNoMes = 0;

  for (const t of transacoes) {
    if (t.tipo === 'DESPESA' && inPeriodo(t.dataTransacao, periodo)) {
      despesasNoMes += 1;
    }
    if (t.status !== 'PENDENTE') continue;

    const adim = calcularAdimplencia(t.status, t.vencimento, hoje);
    if (adim === 'ATRASADO') {
      atrasados += 1;
    }
    if (t.categoria === 'MENSALIDADE' && t.vencimento && inPeriodo(t.vencimento, periodo)) {
      mensalidadesPendentes += 1;
    }
  }

  return { mensalidadesPendentes, atrasados, despesasNoMes };
}

export function buildConciliacaoTotais(
  transacoes: TransacaoConciliacao[],
  periodo: Periodo
): ConciliacaoTotais {
  const noMes = transacoes.filter((t) => inPeriodo(t.dataTransacao, periodo));
  const { receitasConcluidas, despesasConcluidas, saldo } = calcularTotaisConcluidos(
    noMes.map((t) => ({
      tipo: t.tipo,
      categoria: t.categoria,
      valor: t.valor,
      status: t.status,
      dataTransacao: t.dataTransacao,
      vencimento: t.vencimento,
    }))
  );
  return {
    receitas: receitasConcluidas,
    despesas: despesasConcluidas,
    saldo,
  };
}

export function snapshotFechamento(
  checklist: ConciliacaoChecklist,
  totais: ConciliacaoTotais
) {
  return {
    receitasTotal: totais.receitas,
    despesasTotal: totais.despesas,
    saldo: totais.saldo,
    pendentesQtd: checklist.mensalidadesPendentes,
    atrasadosQtd: checklist.atrasados,
  };
}
