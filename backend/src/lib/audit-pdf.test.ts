import { describe, it, expect } from 'vitest';
import { gerarPdfAuditoria } from './audit-pdf.js';

describe('gerarPdfAuditoria', () => {
  it('gera buffer PDF com registros', async () => {
    const buf = await gerarPdfAuditoria(
      [
        {
          id: 1,
          usuarioId: 1,
          login: 'admin',
          setor: 'DIRETORIA',
          metodo: 'POST',
          recurso: 'public',
          acao: 'create',
          entidadeTipo: null,
          entidadeId: null,
          statusHttp: 200,
          sucesso: true,
          detalhe: null,
          rota: 'portal.newsletter.subscribe',
          motivo: 'novo_inscrito',
          ip: '127.0.0.1',
          userAgent: null,
          createdAt: new Date('2026-06-05T12:00:00Z'),
        },
      ],
      'pt-BR'
    );
    expect(buf.length).toBeGreaterThan(100);
    expect(buf.subarray(0, 4).toString()).toBe('%PDF');
  });

  it('gera PDF vazio quando sem logs', async () => {
    const buf = await gerarPdfAuditoria([], 'en');
    expect(buf.subarray(0, 4).toString()).toBe('%PDF');
  });
});
