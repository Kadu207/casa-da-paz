import type { Prisma, StatusTransacao, TipoTransacao } from '@prisma/client';
import type { AdimplenciaStatus } from './adimplencia.js';

export interface ListagemFiltros {
  de?: string;
  ate?: string;
  tipo?: TipoTransacao;
  categoria?: string;
  status?: StatusTransacao;
  adimplencia?: AdimplenciaStatus;
  pessoaId?: number;
}

export interface PaginacaoMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
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

export function parseIsoDateLocal(value: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

const TIPOS: TipoTransacao[] = ['RECEITA', 'DESPESA'];
const STATUS: StatusTransacao[] = ['PENDENTE', 'CONCLUIDO'];
const ADIMPLENCIAS: AdimplenciaStatus[] = ['EM_DIA', 'ATRASADO', 'PAGO'];

export function parseListagemQuery(
  q: Record<string, string | undefined>
): ListagemFiltros | string {
  const filtros: ListagemFiltros = {};

  if (q.de) filtros.de = q.de;
  if (q.ate) filtros.ate = q.ate;

  if (q.tipo) {
    if (!TIPOS.includes(q.tipo as TipoTransacao)) return 'tipo inválido';
    filtros.tipo = q.tipo as TipoTransacao;
  }

  if (q.categoria) filtros.categoria = q.categoria;

  if (q.status) {
    if (!STATUS.includes(q.status as StatusTransacao)) return 'status inválido';
    filtros.status = q.status as StatusTransacao;
  }

  if (q.adimplencia) {
    if (!ADIMPLENCIAS.includes(q.adimplencia as AdimplenciaStatus)) {
      return 'adimplencia inválida';
    }
    filtros.adimplencia = q.adimplencia as AdimplenciaStatus;
  }

  if (q.pessoaId) {
    const pessoaId = Number(q.pessoaId);
    if (!Number.isInteger(pessoaId) || pessoaId <= 0) return 'pessoaId inválido';
    filtros.pessoaId = pessoaId;
  }

  return filtros;
}

export function whereAdimplencia(
  adimplencia: AdimplenciaStatus,
  hoje: Date = new Date()
): Prisma.FinanceiroTransacaoWhereInput {
  const h = startOfDay(hoje);

  if (adimplencia === 'PAGO') {
    return { status: 'CONCLUIDO' };
  }

  if (adimplencia === 'ATRASADO') {
    return { status: 'PENDENTE', vencimento: { lt: h } };
  }

  return {
    status: 'PENDENTE',
    OR: [{ vencimento: null }, { vencimento: { gte: h } }],
  };
}

export function buildListagemWhere(
  filtros: ListagemFiltros,
  scope?: Prisma.FinanceiroTransacaoWhereInput
): Prisma.FinanceiroTransacaoWhereInput | string {
  const base: Prisma.FinanceiroTransacaoWhereInput = { ...scope };

  if (filtros.tipo) base.tipo = filtros.tipo;
  if (filtros.categoria) base.categoria = filtros.categoria;
  if (filtros.status) base.status = filtros.status;
  if (filtros.pessoaId) base.pessoaId = filtros.pessoaId;

  if (filtros.de || filtros.ate) {
    if (!filtros.de || !filtros.ate) return 'Informe de e ate juntos';
    const de = parseIsoDateLocal(filtros.de);
    const ate = parseIsoDateLocal(filtros.ate);
    if (!de || !ate) return 'Datas inválidas; use formato YYYY-MM-DD';
    if (de > ate) return 'de não pode ser posterior a ate';
    base.dataTransacao = { gte: startOfDay(de), lte: endOfDay(ate) };
  }

  if (filtros.adimplencia) {
    return { AND: [base, whereAdimplencia(filtros.adimplencia)] };
  }

  return base;
}

export function parsePaginacao(
  pageRaw?: string,
  limitRaw?: string
): { paginated: boolean; page: number; limit: number } {
  if (pageRaw === undefined && limitRaw === undefined) {
    return { paginated: false, page: 1, limit: 50 };
  }

  const page = Math.max(1, Number.parseInt(pageRaw ?? '1', 10) || 1);
  const limit = Math.min(100, Math.max(1, Number.parseInt(limitRaw ?? '50', 10) || 50));

  return { paginated: true, page, limit };
}

export function paginateMeta(total: number, page: number, limit: number): PaginacaoMeta {
  return {
    page,
    limit,
    total,
    totalPages: total === 0 ? 0 : Math.ceil(total / limit),
  };
}
