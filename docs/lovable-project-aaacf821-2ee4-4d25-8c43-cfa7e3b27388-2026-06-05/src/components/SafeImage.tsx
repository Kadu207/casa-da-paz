import { useEffect, useRef, useState, type ImgHTMLAttributes } from "react";
import { reportImageFallback } from "@/lib/image-telemetry";

/** Cria um atributo srcSet a partir de uma URL base e uma lista de larguras.
 *  Usa o query param `?w=` comum em CDNs de imagem; se o CDN não o suportar,
 *  o parâmetro é ignorado e a imagem original é servida. */
export function buildSrcSet(url: string, widths: number[]) {
  return widths.map((w) => `${url}?w=${w} ${w}w`).join(", ");
}

type Props = ImgHTMLAttributes<HTMLImageElement> & {
  /** Texto curto exibido como placeholder se o CDN falhar. */
  fallbackLabel?: string;
};

/**
 * Imagem com lazy loading por padrão, decoding assíncrono e
 * placeholder elegante (skeleton + rótulo) caso o CDN falhe.
 *
 * - `loading="lazy"` e `decoding="async"` por padrão (sobrescrevíveis).
 * - Shimmer enquanto carrega; some assim que a imagem chega.
 * - Em caso de erro de rede/CDN, renderiza um bloco temático com o rótulo
 *   e envia telemetria para acompanhamento da qualidade do CDN.
 * - Checa `img.complete` após montagem para cobrir o caso em que a imagem
 *   já estava em cache (e o `onLoad` nunca chega a disparar).
 */
export function SafeImage({
  fallbackLabel,
  className,
  onLoad,
  onError,
  loading = "lazy",
  decoding = "async",
  alt = "",
  ...rest
}: Props) {
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [status, setStatus] = useState<"loading" | "loaded" | "error">(
    "loading",
  );

  // Cobre o caso em que a imagem já estava no cache do browser e o evento
  // `onLoad` nunca chega a disparar após a hidratação — sem isso ela ficaria
  // invisível para sempre.
  useEffect(() => {
    const el = imgRef.current;
    if (!el) return;
    if (el.complete) {
      if (el.naturalWidth > 0) {
        setStatus("loaded");
      } else {
        setStatus("error");
        reportImageFallback({
          src: typeof rest.src === "string" ? rest.src : undefined,
          label: fallbackLabel ?? (typeof alt === "string" ? alt : undefined),
        });
      }
    }
    // Roda só na montagem inicial.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (status === "error") {
    return (
      <div
        role="img"
        aria-label={typeof alt === "string" && alt ? alt : fallbackLabel}
        className={
          "flex items-center justify-center bg-gradient-to-br from-primary/15 via-card to-primary/5 text-primary/70 font-serif text-xs sm:text-sm text-center px-2 " +
          (className ?? "")
        }
        style={{
          width: rest.width ? `${rest.width}px` : undefined,
          height: rest.height ? `${rest.height}px` : undefined,
          maxWidth: "100%",
        }}
      >
        <span aria-hidden="true" className="opacity-80">
          {fallbackLabel ?? alt ?? "Imagem indisponível"}
        </span>
      </div>
    );
  }

  return (
    <div className="relative block h-full w-full overflow-hidden">
      {status === "loading" && (
        <div
          aria-hidden="true"
          className="absolute inset-0 animate-pulse bg-gradient-to-br from-muted via-card to-muted"
        />
      )}
      <img
        {...rest}
        ref={imgRef}
        alt={alt}
        loading={loading}
        decoding={decoding}
        className={className}
        onLoad={(e) => {
          setStatus("loaded");
          onLoad?.(e);
        }}
        onError={(e) => {
          setStatus("error");
          reportImageFallback({
            src: typeof rest.src === "string" ? rest.src : undefined,
            label: fallbackLabel ?? (typeof alt === "string" ? alt : undefined),
          });
          onError?.(e);
        }}
      />
    </div>
  );
}

export default SafeImage;
