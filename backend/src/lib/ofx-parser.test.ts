import { describe, it, expect } from 'vitest';
import { parseOfx, datasProximas } from './ofx-parser.js';

describe('ofx-parser', () => {
  it('parses STMTTRN blocks', () => {
    const ofx = `
OFXHEADER:100
<OFX>
<BANKMSGSRSV1>
<STMTTRN>
<TRNTYPE>DEBIT
<DTPOSTED>20260801
<TRNAMT>-150.50
<FITID>ABC123
<MEMO>Conta luz
</STMTTRN>
<STMTTRN>
<TRNTYPE>CREDIT
<DTPOSTED>20260802
<TRNAMT>200.00
<FITID>XYZ999
<NAME>Doacao
</STMTTRN>
</BANKMSGSRSV1>
</OFX>`;
    const txns = parseOfx(ofx);
    expect(txns).toHaveLength(2);
    expect(txns[0].fitId).toBe('ABC123');
    expect(txns[0].tipo).toBe('DESPESA');
    expect(txns[0].valor).toBe(150.5);
    expect(txns[1].tipo).toBe('RECEITA');
    expect(txns[1].valor).toBe(200);
  });

  it('datasProximas within 2 days', () => {
    const a = new Date('2026-08-01T00:00:00Z');
    const b = new Date('2026-08-02T00:00:00Z');
    expect(datasProximas(a, b, 2)).toBe(true);
    expect(datasProximas(a, new Date('2026-08-10T00:00:00Z'), 2)).toBe(false);
  });
});
