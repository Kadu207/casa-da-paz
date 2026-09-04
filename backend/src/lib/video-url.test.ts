import { describe, expect, it } from 'vitest';
import { isAllowedVideoUrl, midiaAoVivoWhere, parseVideoUrl, slugifyMidia, youtubeThumbnailUrl } from './video-url.js';

describe('parseVideoUrl', () => {
  it('aceita YouTube watch / youtu.be / shorts / embed', () => {
    expect(parseVideoUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ')?.id).toBe('dQw4w9WgXcQ');
    expect(parseVideoUrl('https://youtu.be/dQw4w9WgXcQ')?.provider).toBe('YOUTUBE');
    expect(parseVideoUrl('https://www.youtube.com/shorts/dQw4w9WgXcQ')?.embedUrl).toContain(
      'youtube-nocookie.com/embed/dQw4w9WgXcQ'
    );
    expect(parseVideoUrl('https://www.youtube.com/embed/dQw4w9WgXcQ')?.canonicalUrl).toContain(
      'watch?v=dQw4w9WgXcQ'
    );
  });

  it('aceita Vimeo', () => {
    const p = parseVideoUrl('https://vimeo.com/123456789');
    expect(p?.provider).toBe('VIMEO');
    expect(p?.embedUrl).toBe('https://player.vimeo.com/video/123456789');
  });

  it('rejeita hosts não permitidos', () => {
    expect(isAllowedVideoUrl('https://example.com/video.mp4')).toBe(false);
    expect(isAllowedVideoUrl('https://www.dailymotion.com/video/x')).toBe(false);
    expect(parseVideoUrl('not-a-url')).toBeNull();
  });

  it('gera thumbnail padrão do YouTube', () => {
    expect(youtubeThumbnailUrl('dQw4w9WgXcQ')).toBe(
      'https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg'
    );
  });
});

describe('midiaAoVivoWhere', () => {
  it('exige PUBLICADO e publicadoEm null ou <= now', () => {
    const now = new Date('2026-09-04T12:00:00.000Z');
    const w = midiaAoVivoWhere(now);
    expect(w.status).toBe('PUBLICADO');
    expect(w.OR).toEqual([{ publicadoEm: null }, { publicadoEm: { lte: now } }]);
  });
});

describe('slugifyMidia', () => {
  it('normaliza acentos', () => {
    expect(slugifyMidia('Gira de Pretos Velhos')).toBe('gira-de-pretos-velhos');
  });
});
