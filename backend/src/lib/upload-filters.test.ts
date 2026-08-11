import { describe, expect, it } from 'vitest';
import {
  isAllowedExcelUpload,
  isAllowedImageMime,
  isAllowedOfxUpload,
} from './upload-filters.js';

describe('upload-filters', () => {
  it('aceita imagens permitidas', () => {
    expect(isAllowedImageMime('image/jpeg')).toBe(true);
    expect(isAllowedImageMime('image/gif')).toBe(false);
  });

  it('aceita OFX só com extensão e MIME permitidos', () => {
    expect(isAllowedOfxUpload('application/octet-stream', 'extrato.ofx')).toBe(true);
    expect(isAllowedOfxUpload('text/plain', 'x.qfx')).toBe(true);
    expect(isAllowedOfxUpload('application/pdf', 'x.ofx')).toBe(false);
    expect(isAllowedOfxUpload('application/octet-stream', 'x.pdf')).toBe(false);
  });

  it('aceita apenas .xlsx', () => {
    expect(
      isAllowedExcelUpload(
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'a.xlsx'
      )
    ).toBe(true);
    expect(isAllowedExcelUpload('application/octet-stream', 'a.xls')).toBe(false);
  });
});
