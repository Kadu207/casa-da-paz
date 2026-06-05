import { StatusTransacao } from '@prisma/client';

export type AdimplenciaStatus = 'EM_DIA' | 'ATRASADO' | 'PAGO';

export function calcularAdimplencia(
  status: StatusTransacao,
  vencimento: Date | null | undefined,
  hoje: Date = new Date()
): AdimplenciaStatus {
  if (status === 'CONCLUIDO') return 'PAGO';
  if (!vencimento) return 'EM_DIA';
  const v = new Date(vencimento);
  v.setHours(0, 0, 0, 0);
  const h = new Date(hoje);
  h.setHours(0, 0, 0, 0);
  return h > v ? 'ATRASADO' : 'EM_DIA';
}
