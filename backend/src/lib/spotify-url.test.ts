import { describe, expect, it } from 'vitest';
import { canAccess } from '../policies/rbac.js';
import { parseSpotifyUrl, parseTelegramUrl } from './spotify-url.js';

describe('parseSpotifyUrl', () => {
  it('aceita playlist e faixa oficiais', () => {
    const playlist = parseSpotifyUrl('https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M');
    expect(playlist?.kind).toBe('playlist');
    expect(playlist?.embedUrl).toBe('https://open.spotify.com/embed/playlist/37i9dQZF1DXcBWIGoYBM5M');

    const track = parseSpotifyUrl('https://open.spotify.com/track/11dFghVXANMlKmJXsNCbNl?si=abc');
    expect(track?.embedUrl).toBe('https://open.spotify.com/embed/track/11dFghVXANMlKmJXsNCbNl');
  });

  it('recusa domínio fora do Spotify', () => {
    expect(parseSpotifyUrl('https://example.com/track/11dFghVXANMlKmJXsNCbNl')).toBeNull();
    expect(parseSpotifyUrl('https://open.spotify.com/user/casa')).toBeNull();
  });
});

describe('parseTelegramUrl', () => {
  it('normaliza t.me', () => {
    expect(parseTelegramUrl('https://t.me/casadapaz')).toBe('https://t.me/casadapaz');
    expect(parseTelegramUrl('https://evil.example/t.me/casadapaz')).toBeNull();
  });
});

describe('RBAC pontos via marketing', () => {
  it('MARKETING, DIRETORIA, SUPERVISOR e ADMIN gravam', () => {
    expect(canAccess('MARKETING', 'marketing', 'write')).toBe(true);
    expect(canAccess('DIRETORIA', 'marketing', 'write')).toBe(true);
    expect(canAccess('SUPERVISOR', 'marketing', 'write')).toBe(true);
    expect(canAccess('ADMIN', 'marketing', 'write')).toBe(true);
  });

  it('MEDIUM sem policy não grava', () => {
    expect(canAccess('MEDIUM', 'marketing', 'write')).toBe(false);
    expect(canAccess('MEDIUM', 'marketing', 'read')).toBe(false);
  });
});
