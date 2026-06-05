/**
 * Telemetria leve para falhas de carregamento de imagens (SafeImage).
 *
 * - Mantém um contador in-memory acessível em `window.__imageFallbackStats`
 *   para inspeção rápida no DevTools.
 * - Persiste o contador agregado em `localStorage` para acompanhar a
 *   qualidade do CDN entre sessões.
 * - Reporta cada falha ao Lovable (via `reportLovableError`) com severidade
 *   "warning", permitindo acompanhar via logs/runtime errors.
 * - Faz debounce simples por `src` (evita poluir telemetria se a mesma
 *   imagem falhar repetidamente no mesmo carregamento).
 */
import { reportLovableError } from "./lovable-error-reporting";

const STORAGE_KEY = "casa-da-paz:image-fallback-stats";

type FallbackStats = {
  total: number;
  lastAt: string | null;
  bySrc: Record<string, number>;
};

type ImageFallbackInfo = {
  src?: string;
  label?: string;
};

declare global {
  interface Window {
    __imageFallbackStats?: FallbackStats;
  }
}

const reportedThisSession = new Set<string>();

function readStats(): FallbackStats {
  if (typeof window === "undefined") {
    return { total: 0, lastAt: null, bySrc: {} };
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<FallbackStats>;
      return {
        total: typeof parsed.total === "number" ? parsed.total : 0,
        lastAt: typeof parsed.lastAt === "string" ? parsed.lastAt : null,
        bySrc:
          parsed.bySrc && typeof parsed.bySrc === "object"
            ? (parsed.bySrc as Record<string, number>)
            : {},
      };
    }
  } catch {
    // localStorage indisponível (modo privado, SSR, etc.) — ignora silenciosamente.
  }
  return { total: 0, lastAt: null, bySrc: {} };
}

function writeStats(stats: FallbackStats) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
  } catch {
    // ignora limites de quota / privacidade.
  }
  window.__imageFallbackStats = stats;
}

export function reportImageFallback(info: ImageFallbackInfo = {}) {
  if (typeof window === "undefined") return;

  const key = info.src ?? info.label ?? "unknown";
  if (reportedThisSession.has(key)) return;
  reportedThisSession.add(key);

  const stats = readStats();
  stats.total += 1;
  stats.lastAt = new Date().toISOString();
  stats.bySrc[key] = (stats.bySrc[key] ?? 0) + 1;
  writeStats(stats);

  // Log estruturado para DevTools / monitoramento.
  console.warn("[SafeImage] CDN fallback acionado", {
    ...info,
    total: stats.total,
  });

  // Envia ao pipeline de erros do Lovable como aviso (não-bloqueante).
  reportLovableError(new Error(`Image CDN fallback: ${key}`), {
    kind: "image_cdn_fallback",
    src: info.src,
    label: info.label,
    totalFallbacks: stats.total,
  });
}

/** Permite inspecionar/zerar o contador a partir do DevTools ou de testes. */
export function getImageFallbackStats(): FallbackStats {
  if (typeof window !== "undefined" && window.__imageFallbackStats) {
    return window.__imageFallbackStats;
  }
  return readStats();
}

export function resetImageFallbackStats() {
  reportedThisSession.clear();
  const empty: FallbackStats = { total: 0, lastAt: null, bySrc: {} };
  writeStats(empty);
}
