/** Helpers de embed YouTube/Vimeo no frontend (espelha backend/src/lib/video-url.ts). */

export type VideoProvider = 'YOUTUBE' | 'VIMEO';

export function parseVideoEmbed(raw: string | null | undefined): {
  provider: VideoProvider;
  embedUrl: string;
} | null {
  if (!raw?.trim()) return null;
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    return null;
  }
  const host = url.hostname.toLowerCase();

  if (
    host.includes('youtube.com') ||
    host === 'youtu.be' ||
    host.includes('youtube-nocookie.com')
  ) {
    let id: string | null = null;
    if (host === 'youtu.be' || host === 'www.youtu.be') {
      id = url.pathname.replace(/^\//, '').split('/')[0] || null;
    } else if (url.pathname.startsWith('/embed/')) {
      id = url.pathname.slice('/embed/'.length).split('/')[0] || null;
    } else if (url.pathname.startsWith('/shorts/')) {
      id = url.pathname.slice('/shorts/'.length).split('/')[0] || null;
    } else {
      id = url.searchParams.get('v');
    }
    if (!id) return null;
    return { provider: 'YOUTUBE', embedUrl: `https://www.youtube-nocookie.com/embed/${id}` };
  }

  if (host.includes('vimeo.com')) {
    const m =
      host === 'player.vimeo.com'
        ? url.pathname.match(/^\/video\/(\d+)/)
        : url.pathname.match(/\/(\d+)(?:\/|$)/);
    const id = m?.[1];
    if (!id) return null;
    return { provider: 'VIMEO', embedUrl: `https://player.vimeo.com/video/${id}` };
  }

  return null;
}
