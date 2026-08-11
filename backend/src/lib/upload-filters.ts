/** Filtros Multer — MIME / extensão permitidos. */

export const IMAGE_MIMES = ['image/jpeg', 'image/png', 'image/webp'] as const;

export function isAllowedImageMime(mime: string): boolean {
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
