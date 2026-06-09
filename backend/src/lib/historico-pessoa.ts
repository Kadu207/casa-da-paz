import { calcularAdimplencia } from './adimplencia.js';
import type { StatusTransacao } from '@prisma/client';

export interface TransacaoHistorico {
  status: StatusTransacao;
  vencimento: Date | null;
  valor: number;
}

export interface HistoricoResumo {
  totalPago: number;
  totalPendente: number;
  atrasadosQtd: number;
}

export function buildHistoricoResumo(
  transacoes: TransacaoHistorico[],
  hoje: Date = new Date()
): HistoricoResumo {
  let totalPago = 0;
  let totalPendente = 0;
  let atrasadosQtd = 0;

  for (const t of transacoes) {
    if (t.status === 'CONCLUIDO') {
      totalPago += t.valor;
    } else {
      totalPendente += t.valor;
      if (calcularAdimplencia(t.status, t.vencimento, hoje) === 'ATRASADO') {
        atrasadosQtd += 1;
      }
    }
  }

  return { totalPago, totalPendente, atrasadosQtd };
}
