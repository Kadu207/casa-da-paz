/** Filtros Multer — MIME / extensão / magic bytes permitidos. */

export const IMAGE_MIMES = ['image/jpeg', 'image/png', 'image/webp'] as const;
export type ImageMime = (typeof IMAGE_MIMES)[number];

export function isAllowedImageMime(mime: string): mime is ImageMime {
  return (IMAGE_MIMES as readonly string[]).includes(mime);
}

export function isAllowedOfxUpload(mime: string, originalname: string): boolean {
  const name = originalname.toLowerCase();
  if (!name.endsWith('.ofx') && !name.endsWith('.qfx')) return false;
  const m = mime.toLowerCase();
  return (
    m === 'application/x-ofx' ||
    m === 'application/ofx' ||
    m === 'application/octet-stream' ||
    m === 'text/plain' ||
    m === 'application/xml' ||
    m === 'text/xml'
  );
}

export function isAllowedExcelUpload(mime: string, originalname: string): boolean {
  const name = originalname.toLowerCase();
  if (!name.endsWith('.xlsx')) return false;
  const m = mime.toLowerCase();
  return (
    m === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
    m === 'application/octet-stream' ||
    m === 'application/zip'
  );
}

/** Assinaturas de arquivo (magic bytes) — defesa além do MIME declarado. */

function startsWithBytes(buf: Buffer, sig: number[]): boolean {
  if (buf.length < sig.length) return false;
  return sig.every((b, i) => buf[i] === b);
}

export function isJpegMagic(buf: Buffer): boolean {
  return startsWithBytes(buf, [0xff, 0xd8, 0xff]);
}

export function isPngMagic(buf: Buffer): boolean {
  return startsWithBytes(buf, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
}

export function isWebpMagic(buf: Buffer): boolean {
  if (buf.length < 12) return false;
  return (
    buf[0] === 0x52 &&
    buf[1] === 0x49 &&
    buf[2] === 0x46 &&
    buf[3] === 0x46 &&
    buf[8] === 0x57 &&
    buf[9] === 0x45 &&
    buf[10] === 0x42 &&
    buf[11] === 0x50
  );
}

export function isAllowedImageBuffer(buf: Buffer, mime: ImageMime): boolean {
  switch (mime) {
    case 'image/jpeg':
      return isJpegMagic(buf);
    case 'image/png':
      return isPngMagic(buf);
    case 'image/webp':
      return isWebpMagic(buf);
    default: {
      const _exhaustive: never = mime;
      return _exhaustive;
    }
  }
}

/** XLSX é ZIP (PK..). */
export function isZipMagic(buf: Buffer): boolean {
  return startsWithBytes(buf, [0x50, 0x4b]);
}

export function isAllowedExcelBuffer(buf: Buffer): boolean {
  return isZipMagic(buf);
}

/**
 * OFX/QFX: texto com cabeçalho OFXHEADER, ou XML OFX.
 * Rejeita binários óbvios (PDF/ZIP).
 */
export function isAllowedOfxBuffer(buf: Buffer): boolean {
  if (buf.length === 0) return false;
  if (isZipMagic(buf) || startsWithBytes(buf, [0x25, 0x50, 0x44, 0x46])) return false;
  const head = buf.subarray(0, Math.min(buf.length, 512)).toString('utf8').toUpperCase();
  return (
    head.includes('OFXHEADER') ||
    head.includes('<OFX') ||
    head.includes('<?OFX') ||
    head.includes('OFXHEADER:')
  );
}
