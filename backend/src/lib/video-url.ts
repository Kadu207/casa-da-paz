/** Validação e embed de URLs YouTube / Vimeo (Spec 034). */

export type VideoProvider = 'YOUTUBE' | 'VIMEO';

export interface ParsedVideoUrl {
  provider: VideoProvider;
  id: string;
  canonicalUrl: string;
  embedUrl: string;
}

const YT_HOSTS = new Set([
  'youtube.com',
  'www.youtube.com',
  'm.youtube.com',
  'youtu.be',
  'www.youtu.be',
  'youtube-nocookie.com',
  'www.youtube-nocookie.com',
]);

const VIMEO_HOSTS = new Set(['vimeo.com', 'www.vimeo.com', 'player.vimeo.com']);

function hostOf(raw: string): string | null {
  try {
    return new URL(raw).hostname.toLowerCase();
  } catch {
    return null;
  }
}

function youtubeId(url: URL): string | null {
  const host = url.hostname.toLowerCase();
  if (host === 'youtu.be' || host === 'www.youtu.be') {
    const id = url.pathname.replace(/^\//, '').split('/')[0];
    return id && /^[\w-]{6,}$/.test(id) ? id : null;
  }
  if (url.pathname.startsWith('/embed/')) {
    const id = url.pathname.slice('/embed/'.length).split('/')[0];
    return id && /^[\w-]{6,}$/.test(id) ? id : null;
  }
  if (url.pathname.startsWith('/shorts/')) {
    const id = url.pathname.slice('/shorts/'.length).split('/')[0];
    return id && /^[\w-]{6,}$/.test(id) ? id : null;
  }
  const v = url.searchParams.get('v');
  return v && /^[\w-]{6,}$/.test(v) ? v : null;
}

function vimeoId(url: URL): string | null {
  const host = url.hostname.toLowerCase();
  if (host === 'player.vimeo.com') {
    const m = url.pathname.match(/^\/video\/(\d+)/);
    return m?.[1] ?? null;
  }
  const m = url.pathname.match(/\/(\d+)(?:\/|$)/);
  return m?.[1] ?? null;
}

export function youtubeThumbnailUrl(videoId: string): string {
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}

/** Parseia URL YouTube/Vimeo; retorna null se inválida. */
export function parseVideoUrl(raw: string): ParsedVideoUrl | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return null;
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
  const host = url.hostname.toLowerCase();

  if (YT_HOSTS.has(host)) {
    const id = youtubeId(url);
    if (!id) return null;
    return {
      provider: 'YOUTUBE',
      id,
      canonicalUrl: `https://www.youtube.com/watch?v=${id}`,
      embedUrl: `https://www.youtube-nocookie.com/embed/${id}`,
    };
  }

  if (VIMEO_HOSTS.has(host)) {
    const id = vimeoId(url);
    if (!id) return null;
    return {
      provider: 'VIMEO',
      id,
      canonicalUrl: `https://vimeo.com/${id}`,
      embedUrl: `https://player.vimeo.com/video/${id}`,
    };
  }

  return null;
}

export function isAllowedVideoUrl(raw: string): boolean {
  return parseVideoUrl(raw) !== null;
}

export function hostAllowedForVideo(raw: string): boolean {
  const h = hostOf(raw);
  if (!h) return false;
  return YT_HOSTS.has(h) || VIMEO_HOSTS.has(h);
}

/** Where “ao vivo” para listagens consumidoras. */
export function midiaAoVivoWhere(now: Date = new Date()) {
  return {
    status: 'PUBLICADO' as const,
    OR: [{ publicadoEm: null }, { publicadoEm: { lte: now } }],
  };
}

export function slugifyMidia(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);
}
