export interface OfxTxn {
  fitId: string;
  data: Date;
  valor: number;
  tipo: 'RECEITA' | 'DESPESA';
  memo?: string;
}

function parseOfxDate(raw: string): Date {
  const digits = raw.replace(/\D/g, '').slice(0, 8);
  const y = Number(digits.slice(0, 4));
  const m = Number(digits.slice(4, 6));
  const d = Number(digits.slice(6, 8));
  return new Date(Date.UTC(y, m - 1, d));
}

/** Parser mínimo OFX 1.x / SGML (STMTTRN blocks). */
export function parseOfx(content: string): OfxTxn[] {
  const blocks = content.split(/<STMTTRN>/i).slice(1);
  const out: OfxTxn[] = [];

  for (const block of blocks) {
    const chunk = block.split(/<\/STMTTRN>/i)[0] ?? block;
    const fitId =
      chunk.match(/<FITID>([^<\r\n]+)/i)?.[1]?.trim() ??
      chunk.match(/<FITID>\s*([^<\r\n]+)/i)?.[1]?.trim();
    const dt =
      chunk.match(/<DTPOSTED>([^<\r\n]+)/i)?.[1]?.trim() ??
      chunk.match(/<DTPOSTED>\s*([^<\r\n]+)/i)?.[1]?.trim();
    const amtRaw =
      chunk.match(/<TRNAMT>([^<\r\n]+)/i)?.[1]?.trim() ??
      chunk.match(/<TRNAMT>\s*([^<\r\n]+)/i)?.[1]?.trim();
    const memo =
      chunk.match(/<MEMO>([^<\r\n]+)/i)?.[1]?.trim() ??
      chunk.match(/<NAME>([^<\r\n]+)/i)?.[1]?.trim();

    if (!fitId || !dt || !amtRaw) continue;
    const valorSigned = Number(amtRaw.replace(',', '.'));
    if (Number.isNaN(valorSigned)) continue;

    out.push({
      fitId,
      data: parseOfxDate(dt),
      valor: Math.abs(valorSigned),
      tipo: valorSigned >= 0 ? 'RECEITA' : 'DESPESA',
      memo,
    });
  }

  return out;
}

export function datasProximas(a: Date, b: Date, dias = 2): boolean {
  const ms = Math.abs(a.getTime() - b.getTime());
  return ms <= dias * 24 * 60 * 60 * 1000;
}
