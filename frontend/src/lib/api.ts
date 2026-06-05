const API_BASE = import.meta.env.VITE_API_URL ?? '/api';

export function getToken(): string | null {
  return localStorage.getItem('token');
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error ?? 'Erro na API');
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}
