/**
 * Allowlist de esquemas para href/src controlados por API/usuário.
 * Aceita http(s) absolutos e caminhos relativos da app (/...).
 */
export function safeUrl(raw: string | null | undefined): string | null {
  if (raw == null) return null;
  const value = String(raw).trim();
  if (!value) return null;

  if (value.startsWith('/') && !value.startsWith('//')) {
    return value;
  }

  try {
    const u = new URL(value);
    if (u.protocol === 'http:' || u.protocol === 'https:') {
      return u.toString();
    }
  } catch {
    return null;
  }
  return null;
}

export function safeHref(raw: string | null | undefined): string | undefined {
  return safeUrl(raw) ?? undefined;
}

export function safeImgSrc(raw: string | null | undefined): string | undefined {
  return safeUrl(raw) ?? undefined;
}
