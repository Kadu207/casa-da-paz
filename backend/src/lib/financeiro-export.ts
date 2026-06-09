import { calcularAdimplencia, type AdimplenciaStatus } from './adimplencia.js';
import type { StatusTransacao, TipoTransacao } from '@prisma/client';

export interface TransacaoExportRow {
  id: number;
  tipo: TipoTransacao;
  categoria: string;
  valor: number;
  dataTransacao: Date;
  vencimento: Date | null;
  status: StatusTransacao;
  observacoes: string | null;
  pessoaNome: string | null;
}

const CSV_HEADER =
  'id,tipo,categoria,valor,data_transacao,vencimento,status,adimplencia,pessoa_nome,observacoes';

function escapeCsv(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function fmtDate(d: Date | null): string {
  if (!d) return '';
  return d.toISOString().slice(0, 10);
}

export function formatCsvRow(row: TransacaoExportRow): string {
  const adim: AdimplenciaStatus = calcularAdimplencia(row.status, row.vencimento);
  return [
    row.id,
    row.tipo,
    row.categoria,
    row.valor.toFixed(2),
    fmtDate(row.dataTransacao),
    fmtDate(row.vencimento),
    row.status,
    adim,
    escapeCsv(row.pessoaNome ?? ''),
    escapeCsv(row.observacoes ?? ''),
  ].join(',');
}

export function buildFinanceiroCsv(rows: TransacaoExportRow[]): string {
  return [CSV_HEADER, ...rows.map(formatCsvRow)].join('\n') + '\n';
}

export function pdfFinanceiroTitulo(periodoLabel: string): string {
  return `Casa da Paz — Relatório financeiro (${periodoLabel})`;
}
