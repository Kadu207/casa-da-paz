const API_BASE = import.meta.env.VITE_API_URL ?? '/api';

export async function publicApi<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    const flat = err.error?.fieldErrors ?? err.error;
    const msg =
      typeof err.error === 'string'
        ? err.error
        : typeof flat === 'object'
          ? Object.values(flat).flat().join('; ') || 'Erro na API'
          : 'Erro na API';
    throw new Error(msg);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}
