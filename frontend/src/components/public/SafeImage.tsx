import { useEffect, useRef, useState, type ImgHTMLAttributes } from 'react';
import { cfImageUrl, cfSrcSet } from '../../lib/cf-image';
import { safeImgSrc } from '../../lib/safe-url';

/** srcSet responsivo — CDN Lovable aceita ?w=; CF Images quando configurado */
export function buildSrcSet(url: string, widths: number[]) {
  const safe = safeImgSrc(url);
  if (!safe) return undefined;
  if (safe.startsWith('http') || safe.startsWith('/portal/')) {
    return widths.map((w) => `${cfImageUrl(safe, w)} ${w}w`).join(', ');
  }
  return cfSrcSet(safe, widths);
}

type Props = ImgHTMLAttributes<HTMLImageElement> & {
  fallbackLabel?: string;
};

export function SafeImage({
  fallbackLabel,
  className,
  onLoad,
  onError,
  loading = 'lazy',
  decoding = 'async',
  alt = '',
  src,
  ...rest
}: Props) {
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>('loading');
  const allowed = typeof src === 'string' ? safeImgSrc(src) : null;
  const resolvedSrc = allowed ? cfImageUrl(allowed) : typeof src === 'string' ? undefined : src;

  useEffect(() => {
    const el = imgRef.current;
    if (!el) return;
    if (!resolvedSrc) {
      setStatus('error');
      return;
    }
    if (el.complete) {
      setStatus(el.naturalWidth > 0 ? 'loaded' : 'error');
    }
  }, [resolvedSrc]);

  if (!resolvedSrc || status === 'error') {
    return (
      <div
        role="img"
        aria-label={typeof alt === 'string' && alt ? alt : fallbackLabel}
        className={
          'flex h-full min-h-[8rem] w-full items-center justify-center bg-gradient-to-br from-primary/15 via-card to-primary/5 text-primary/70 font-serif text-xs sm:text-sm text-center px-2 ' +
          (className ?? '')
        }
      >
        <span aria-hidden="true">{fallbackLabel ?? alt ?? 'Imagem indisponível'}</span>
      </div>
    );
  }

  return (
    <div className="relative block h-full w-full overflow-hidden">
      {status === 'loading' && (
        <div
          aria-hidden="true"
          className="absolute inset-0 animate-pulse bg-gradient-to-br from-muted via-card to-muted"
        />
      )}
      <img
        {...rest}
        ref={imgRef}
        src={resolvedSrc}
        alt={alt}
        loading={loading}
        decoding={decoding}
        className={className}
        onLoad={(e) => {
          setStatus('loaded');
          onLoad?.(e);
        }}
        onError={(e) => {
          setStatus('error');
          onError?.(e);
        }}
      />
    </div>
  );
}
