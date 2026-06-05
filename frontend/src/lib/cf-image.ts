/** Cloudflare Images — resize on-the-fly; URLs externas usam ?w= como no Lovable */
const CF_ACCOUNT = import.meta.env.VITE_CF_IMAGES_ACCOUNT_HASH ?? '';
const CF_VARIANT = import.meta.env.VITE_CF_IMAGES_VARIANT ?? 'public';

export function cfImageUrl(src: string, width?: number): string {
  if (!src) return src;
  if (src.startsWith('http') || src.startsWith('/portal/')) {
    return width ? `${src}${src.includes('?') ? '&' : '?'}w=${width}` : src;
  }
  if (!CF_ACCOUNT) return width ? `${src}?w=${width}` : src;
  const imageId = src.replace(/^\/portal\//, '').replace(/\.(svg|jpg|png|webp)$/, '');
  const base = `https://imagedelivery.net/${CF_ACCOUNT}/${imageId}/${CF_VARIANT}`;
  return width ? `${base}/w=${width}` : base;
}

export function cfSrcSet(src: string, widths: number[]) {
  return widths.map((w) => `${cfImageUrl(src, w)} ${w}w`).join(', ');
}
