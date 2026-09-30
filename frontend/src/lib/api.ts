const API_BASE = import.meta.env.VITE_API_URL ?? '/api';

export function getToken(): string | null {
  return localStorage.getItem('token');
}

type ApiErrorBody = {
  error?: unknown;
  motivo?: string;
  pessoaId?: number;
};

export class ApiError extends Error {
  readonly status: number;
  readonly motivo?: string;
  readonly pessoaId?: number;

  constructor(status: number, body: ApiErrorBody) {
    super(typeof body.error === 'string' ? body.error : 'Erro na API');
    this.name = 'ApiError';
    this.status = status;
    this.motivo = body.motivo;
    this.pessoaId = body.pessoaId;
  }
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
    const err = (await res.json().catch(() => ({ error: res.statusText }))) as ApiErrorBody;
    throw new ApiError(res.status, err);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}
