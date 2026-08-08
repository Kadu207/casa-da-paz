import { describe, expect, it } from 'vitest';
import { auditoriaExportFilename, buildAuditoriaCsv, buildAuditoriaWhere } from './auditoria-export.js';

describe('buildAuditoriaWhere', () => {
  it('filtra por setor e rota', () => {
    const w = buildAuditoriaWhere({ setor: 'DIRETORIA', rota: 'financeiro' });
    expect(w.setor).toBe('DIRETORIA');
    expect(w.rota).toEqual({ contains: 'financeiro', mode: 'insensitive' });
  });

  it('filtra periodo de datas', () => {
    const w = buildAuditoriaWhere({ de: '2026-06-01', ate: '2026-06-30' });
    const createdAt = w.createdAt as { gte?: Date; lte?: Date } | undefined;
    expect(createdAt?.gte).toEqual(new Date('2026-06-01T00:00:00'));
    expect(createdAt?.lte).toEqual(new Date('2026-06-30T23:59:59'));
  });
});

describe('buildAuditoriaCsv', () => {
  it('inclui BOM e cabecalho', () => {
    const csv = buildAuditoriaCsv(
      [
        {
          id: 1,
          usuarioId: 1,
          login: 'suporte',
          setor: 'SUPORTE',
          metodo: 'GET',
          recurso: 'auditoria',
          acao: 'export',
          entidadeTipo: null,
          entidadeId: null,
          statusHttp: 200,
          sucesso: true,
          detalhe: null,
          rota: 'admin.auditoria.export.csv',
          motivo: 'export_filtros',
          ip: '10.0.0.1',
          userAgent: null,
          createdAt: new Date('2026-06-05T12:00:00Z'),
        },
      ],
      'pt-BR'
    );
    expect(csv.startsWith('\uFEFFdata,')).toBe(true);
    expect(csv).toContain('Exportar auditoria (CSV)');
  });
});

describe('auditoriaExportFilename', () => {
  it('usa intervalo quando de/ate informados', () => {
    expect(auditoriaExportFilename('csv', '2026-06-01', '2026-06-09')).toBe(
      'auditoria-2026-06-01_2026-06-09.csv'
    );
  });
});
