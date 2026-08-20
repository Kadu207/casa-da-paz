import { describe, expect, it } from 'vitest';
import {
  isAllowedExcelBuffer,
  isAllowedExcelUpload,
  isAllowedImageBuffer,
  isAllowedImageMime,
  isAllowedOfxBuffer,
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

  it('valida magic bytes de imagem', () => {
    const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
    const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]);
    const webp = Buffer.from([
      0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50,
    ]);
    const fake = Buffer.from('not-an-image');
    expect(isAllowedImageBuffer(jpeg, 'image/jpeg')).toBe(true);
    expect(isAllowedImageBuffer(png, 'image/png')).toBe(true);
    expect(isAllowedImageBuffer(webp, 'image/webp')).toBe(true);
    expect(isAllowedImageBuffer(fake, 'image/jpeg')).toBe(false);
    expect(isAllowedImageBuffer(jpeg, 'image/png')).toBe(false);
  });

  it('valida magic bytes xlsx (ZIP) e OFX texto', () => {
    expect(isAllowedExcelBuffer(Buffer.from([0x50, 0x4b, 0x03, 0x04]))).toBe(true);
    expect(isAllowedExcelBuffer(Buffer.from('%PDF-1.4'))).toBe(false);
    expect(isAllowedOfxBuffer(Buffer.from('OFXHEADER:100\nDATA:OFXSGML\n'))).toBe(true);
    expect(isAllowedOfxBuffer(Buffer.from('<OFX><SIGNONMSGSRSV1>'))).toBe(true);
    expect(isAllowedOfxBuffer(Buffer.from('%PDF-1.4'))).toBe(false);
    expect(isAllowedOfxBuffer(Buffer.from([0x50, 0x4b, 0x03, 0x04]))).toBe(false);
  });
});
