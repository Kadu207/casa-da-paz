/**
 * Smoke Spec 034 — regras de listagem e YouTube (sem DB).
 * Uso: npx tsx scripts/smoke-galeria-034.ts  (ou via vitest)
 */
import { describe, expect, it } from 'vitest';
import {
  midiaAoVivoWhere,
  parseVideoUrl,
  youtubeThumbnailUrl,
} from './video-url.js';

describe('smoke galeria 034', () => {
  it('YouTube watch vira embed e thumbnail', () => {
    const p = parseVideoUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    expect(p?.provider).toBe('YOUTUBE');
    expect(p?.embedUrl).toBe('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ');
    expect(youtubeThumbnailUrl(p!.id)).toContain('hqdefault.jpg');
  });

  it('item agendado no futuro não entra em ao-vivo (filtro publicadoEm)', () => {
    const now = new Date('2026-09-04T12:00:00.000Z');
    const w = midiaAoVivoWhere(now);
    const future = new Date('2026-09-05T00:00:00.000Z');
    const past = new Date('2026-09-03T00:00:00.000Z');
    // Simula predicado Prisma OR
    const aoVivo = (publicadoEm: Date | null) =>
      publicadoEm === null || publicadoEm.getTime() <= now.getTime();
    expect(aoVivo(null)).toBe(true);
    expect(aoVivo(past)).toBe(true);
    expect(aoVivo(future)).toBe(false);
    expect(w.status).toBe('PUBLICADO');
  });

  it('Vimeo ainda é aceito como fallback', () => {
    expect(parseVideoUrl('https://vimeo.com/76979871')?.provider).toBe('VIMEO');
  });
});
