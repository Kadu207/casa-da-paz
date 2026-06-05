import PDFDocument from 'pdfkit';
import type { AdminAuditLog } from '@prisma/client';
import { enriquecerLogAuditoria, type AuditLocale } from './audit-i18n.js';

export function gerarPdfAuditoria(logs: AdminAuditLog[], locale: AuditLocale): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    const chunks: Buffer[] = [];
    doc.on('data', (c) => chunks.push(c as Buffer));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.fontSize(16).text('Casa da Paz — Auditoria', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(9).fillColor('#666').text(`Gerado em ${new Date().toLocaleString(locale === 'en' ? 'en-US' : 'pt-BR')}`, {
      align: 'center',
    });
    doc.moveDown(1);
    doc.fillColor('#000').fontSize(8);

    if (logs.length === 0) {
      doc.text('Nenhum registro encontrado.');
      doc.end();
      return;
    }

    logs.forEach((log, i) => {
      const e = enriquecerLogAuditoria(log, locale);
      if (i > 0) doc.moveDown(0.5);
      doc
        .fontSize(8)
        .text(
          `${e.createdAt.toISOString()} | ${e.setor ?? '—'} | ${e.rotaLabel}\n` +
            `Motivo: ${e.motivoLabel ?? '—'} | IP: ${e.ip ?? '—'}`
        );
    });

    doc.end();
  });
}
