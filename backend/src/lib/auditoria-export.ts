import type { Prisma } from '@prisma/client';
import { enriquecerLogAuditoria, type AuditLocale } from './audit-i18n.js';
import type { AdminAuditLog } from '@prisma/client';

export interface AuditoriaQueryFilters {
  setor?: string;
  rota?: string;
  de?: string;
  ate?: string;
  q?: string;
}

export function buildAuditoriaWhere(q: AuditoriaQueryFilters): Prisma.AdminAuditLogWhereInput {
  const where: Prisma.AdminAuditLogWhereInput = {};
  if (q.setor) where.setor = q.setor;
  if (q.rota) where.rota = { contains: q.rota, mode: 'insensitive' };
  if (q.de || q.ate) {
    where.createdAt = {};
    if (q.de) where.createdAt.gte = new Date(q.de + 'T00:00:00');
    if (q.ate) where.createdAt.lte = new Date(q.ate + 'T23:59:59');
  }
  if (q.q) {
    where.OR = [
      { motivo: { contains: q.q, mode: 'insensitive' } },
      { rota: { contains: q.q, mode: 'insensitive' } },
      { ip: { contains: q.q } },
      { login: { contains: q.q, mode: 'insensitive' } },
      { recurso: { contains: q.q, mode: 'insensitive' } },
      { acao: { contains: q.q, mode: 'insensitive' } },
    ];
  }
  return where;
}

export function buildAuditoriaCsv(logs: AdminAuditLog[], locale: AuditLocale): string {
  const header = 'data,login,setor,metodo,recurso,acao,rota,rota_label,motivo,motivo_label,status_http,sucesso,ip\n';
  const rows = logs
    .map((log) => {
      const e = enriquecerLogAuditoria(log, locale);
      const cols = [
        e.createdAt.toISOString(),
        e.login ?? '',
        e.setor ?? '',
        e.metodo ?? '',
        e.recurso ?? '',
        e.acao ?? '',
        e.rota,
        e.rotaLabel,
        (e.motivo ?? '').replace(/"/g, '""'),
        (e.motivoLabel ?? '').replace(/"/g, '""'),
        e.statusHttp != null ? String(e.statusHttp) : '',
        e.sucesso == null ? '' : e.sucesso ? '1' : '0',
        e.ip ?? '',
      ];
      return cols.map((c) => `"${c}"`).join(',');
    })
    .join('\n');
  return '\uFEFF' + header + rows;
}

export function auditoriaExportFilename(ext: 'csv' | 'pdf', de?: string, ate?: string): string {
  if (de && ate) return `auditoria-${de}_${ate}.${ext}`;
  if (de) return `auditoria-desde-${de}.${ext}`;
  return `auditoria-casa-da-paz.${ext}`;
}
