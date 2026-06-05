/**
 * Autenticação FRONT-ONLY (sem backend).
 *
 * ⚠️ AVISO DE SEGURANÇA
 * --------------------------------------------------------------
 * As credenciais ficam VISÍVEIS no código-fonte do navegador e a
 * sessão é apenas localStorage. Não há Row Level Security real,
 * não há criptografia de senha, não há proteção contra usuário
 * editando o estado. Isto serve só para esconder a UI de admin
 * de quem não conhece as credenciais; NÃO É SEGURO contra
 * qualquer pessoa minimamente técnica.
 *
 * Para produção, habilite o Lovable Cloud e migre para auth real
 * + tabela user_roles com RLS.
 */

import { useEffect, useState, useSyncExternalStore } from "react";

export type Papel = "admin" | "atendente";

export type Usuario = {
  id: string;
  email: string;
  nome: string;
  papel: Papel;
  /** Senha em texto puro — limitação assumida do modo front-only. */
  senha: string;
};

export type Sessao = {
  email: string;
  nome: string;
  papel: Papel;
  iniciadaEm: string;
};

const STORAGE_USERS = "casa-da-paz:usuarios";
const STORAGE_SESSION = "casa-da-paz:sessao";

/** Usuários iniciais — semeados na primeira execução. Edite à vontade. */
const SEED: Usuario[] = [
  {
    id: "u-admin",
    email: "admin@casadapaz.local",
    nome: "Administradora da Casa",
    papel: "admin",
    senha: "admin123",
  },
  {
    id: "u-atendente",
    email: "atendente@casadapaz.local",
    nome: "Atendente",
    papel: "atendente",
    senha: "atendente123",
  },
];

function isBrowser() {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

function lerUsuarios(): Usuario[] {
  if (!isBrowser()) return SEED;
  try {
    const raw = localStorage.getItem(STORAGE_USERS);
    if (!raw) {
      localStorage.setItem(STORAGE_USERS, JSON.stringify(SEED));
      return SEED;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return SEED;
    return parsed as Usuario[];
  } catch {
    return SEED;
  }
}

function gravarUsuarios(lista: Usuario[]) {
  if (!isBrowser()) return;
  localStorage.setItem(STORAGE_USERS, JSON.stringify(lista));
  notificar();
}

function lerSessao(): Sessao | null {
  if (!isBrowser()) return null;
  try {
    const raw = localStorage.getItem(STORAGE_SESSION);
    if (!raw) return null;
    return JSON.parse(raw) as Sessao;
  } catch {
    return null;
  }
}

function gravarSessao(s: Sessao | null) {
  if (!isBrowser()) return;
  if (s) localStorage.setItem(STORAGE_SESSION, JSON.stringify(s));
  else localStorage.removeItem(STORAGE_SESSION);
  notificar();
}

// ---------- assinantes (re-render reativo) ----------
const listeners = new Set<() => void>();
function notificar() {
  listeners.forEach((l) => l());
}
function subscribe(l: () => void) {
  listeners.add(l);
  if (isBrowser()) {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_USERS || e.key === STORAGE_SESSION) l();
    };
    window.addEventListener("storage", onStorage);
    return () => {
      listeners.delete(l);
      window.removeEventListener("storage", onStorage);
    };
  }
  return () => listeners.delete(l);
}

// ---------- API pública ----------
export function login(
  email: string,
  senha: string,
): { ok: true; sessao: Sessao } | { ok: false; erro: string } {
  const e = email.trim().toLowerCase();
  const usuario = lerUsuarios().find(
    (u) => u.email.toLowerCase() === e && u.senha === senha,
  );
  if (!usuario) return { ok: false, erro: "Usuário ou senha inválidos." };
  const sessao: Sessao = {
    email: usuario.email,
    nome: usuario.nome,
    papel: usuario.papel,
    iniciadaEm: new Date().toISOString(),
  };
  gravarSessao(sessao);
  return { ok: true, sessao };
}

export function logout() {
  gravarSessao(null);
}

export function listarUsuarios(): Usuario[] {
  return lerUsuarios();
}

export function criarUsuario(
  dados: Omit<Usuario, "id">,
): { ok: true; usuario: Usuario } | { ok: false; erro: string } {
  const email = dados.email.trim().toLowerCase();
  if (!email || !dados.senha || !dados.nome) {
    return { ok: false, erro: "Preencha nome, e-mail e senha." };
  }
  const lista = lerUsuarios();
  if (lista.some((u) => u.email.toLowerCase() === email)) {
    return { ok: false, erro: "Já existe um usuário com esse e-mail." };
  }
  const novo: Usuario = {
    id: `u-${Date.now().toString(36)}`,
    nome: dados.nome.trim(),
    email,
    papel: dados.papel,
    senha: dados.senha,
  };
  gravarUsuarios([...lista, novo]);
  return { ok: true, usuario: novo };
}

export function atualizarUsuario(
  id: string,
  patch: Partial<Omit<Usuario, "id">>,
): { ok: true } | { ok: false; erro: string } {
  const lista = lerUsuarios();
  const idx = lista.findIndex((u) => u.id === id);
  if (idx === -1) return { ok: false, erro: "Usuário não encontrado." };
  const atualizado: Usuario = { ...lista[idx], ...patch };
  if (patch.email) atualizado.email = patch.email.trim().toLowerCase();
  // Mantém a senha atual se patch.senha vier vazio
  if (patch.senha === "" || patch.senha === undefined) {
    atualizado.senha = lista[idx].senha;
  }
  lista[idx] = atualizado;
  gravarUsuarios(lista);
  return { ok: true };
}

export function removerUsuario(
  id: string,
): { ok: true } | { ok: false; erro: string } {
  const lista = lerUsuarios();
  const restante = lista.filter((u) => u.id !== id);
  if (restante.length === lista.length) {
    return { ok: false, erro: "Usuário não encontrado." };
  }
  if (!restante.some((u) => u.papel === "admin")) {
    return { ok: false, erro: "Deve existir pelo menos um administrador." };
  }
  gravarUsuarios(restante);
  return { ok: true };
}

// ---------- hooks ----------
export function useSessao(): Sessao | null {
  return useSyncExternalStore(
    subscribe,
    () => lerSessao(),
    () => null,
  );
}

export function useUsuarios(): Usuario[] {
  // useSyncExternalStore com getSnapshot estável é necessário; usamos
  // um wrapper com versão para forçar re-render.
  const [, setTick] = useState(0);
  useEffect(() => subscribe(() => setTick((n) => n + 1)), []);
  return lerUsuarios();
}
