const SPOTIFY =
  /^https:\/\/open\.spotify\.com\/(playlist|track|album|episode)\/([A-Za-z0-9]{10,40})\/?(?:\?.*)?$/;

const TELEGRAM = /^https:\/\/(?:t\.me|telegram\.me)\/([A-Za-z0-9_]{4,32})\/?$/;

export type SpotifyKind = 'playlist' | 'track' | 'album' | 'episode';

export interface SpotifyRef {
  kind: SpotifyKind;
  id: string;
  url: string;
  embedUrl: string;
}

export function parseSpotifyUrl(raw: string): SpotifyRef | null {
  const match = SPOTIFY.exec(raw.trim());
  if (!match) return null;
  const kind = match[1] as SpotifyKind;
  const id = match[2];
  return {
    kind,
    id,
    url: `https://open.spotify.com/${kind}/${id}`,
    embedUrl: `https://open.spotify.com/embed/${kind}/${id}`,
  };
}

export function parseTelegramUrl(raw: string): string | null {
  const match = TELEGRAM.exec(raw.trim());
  if (!match) return null;
  return `https://t.me/${match[1]}`;
}
