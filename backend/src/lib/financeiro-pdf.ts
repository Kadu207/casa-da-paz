import PDFDocument from 'pdfkit';
import { buildFinanceiroCsv, type TransacaoExportRow } from './financeiro-export.js';

export function gerarPdfFinanceiro(
  rows: TransacaoExportRow[],
  periodoLabel: string
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    const chunks: Buffer[] = [];
    doc.on('data', (c) => chunks.push(c as Buffer));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.fontSize(14).text(`Casa da Paz — Financeiro (${periodoLabel})`, { align: 'center' });
    doc.moveDown(1);
    doc.fontSize(8);

    if (rows.length === 0) {
      doc.text('Nenhuma transação no período.');
      doc.end();
      return;
    }

    rows.forEach((r, i) => {
      if (i > 0) doc.moveDown(0.3);
      doc.text(
        `#${r.id} ${r.tipo} ${r.categoria} R$ ${r.valor.toFixed(2)} | ${r.status} | ${r.pessoaNome ?? '—'}`
      );
    });

    doc.end();
  });
}

export { buildFinanceiroCsv };
