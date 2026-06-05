/**
 * Fluxo FRONT-ONLY de recuperação de senha.
 *
 * 🧩 INTEGRAÇÃO BACKEND (Cursor)
 * --------------------------------------------------------------
 * Esta camada simula um envio de e-mail: ao invés de enviar um
 * e-mail real, mostra o link de redefinição na tela (modo dev).
 *
 * Para migrar:
 *   1) Substitua `solicitarRecuperacao` por uma chamada ao
 *      backend que dispara o e-mail real (Resend / Supabase Auth
 *      resetPasswordForEmail).
 *   2) Substitua `validarTokenRecuperacao` e
 *      `redefinirSenhaComToken` pelas chamadas equivalentes.
 *   3) NÃO mexa na UI das páginas /recuperar-senha e
 *      /redefinir-senha — elas chamam exatamente esta API.
 */

import { atualizarUsuario, listarUsuarios } from "@/lib/auth-local";

const STORAGE_TOKENS = "casa-da-paz:reset-tokens";
const TTL_MS = 1000 * 60 * 30; // 30 min

type TokenRegistro = {
  token: string;
  email: string;
  criadoEm: number;
  usado: boolean;
};

function isBrowser() {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

function ler(): TokenRegistro[] {
  if (!isBrowser()) return [];
  try {
    const raw = localStorage.getItem(STORAGE_TOKENS);
    return raw ? (JSON.parse(raw) as TokenRegistro[]) : [];
  } catch {
    return [];
  }
}

function gravar(lista: TokenRegistro[]) {
  if (!isBrowser()) return;
  localStorage.setItem(STORAGE_TOKENS, JSON.stringify(lista));
}

function gerarToken(): string {
  // Token aleatório suficiente para o modo front-only
  const arr = new Uint8Array(16);
  if (isBrowser() && window.crypto) window.crypto.getRandomValues(arr);
  else for (let i = 0; i < arr.length; i++) arr[i] = Math.floor(Math.random() * 256);
  return Array.from(arr, (b) => b.toString(16).padStart(2, "0")).join("");
}

export function solicitarRecuperacao(
  email: string,
):
  | { ok: true; token: string; link: string; existe: boolean }
  | { ok: false; erro: string } {
  const e = email.trim().toLowerCase();
  if (!e) return { ok: false, erro: "Informe seu e-mail." };

  const existe = listarUsuarios().some((u) => u.email.toLowerCase() === e);

  // Sempre gera token (independente de existir) para não vazar quem é cadastrado.
  // Mas só armazena se o e-mail existir.
  const token = gerarToken();
  if (existe) {
    const lista = ler().filter((t) => t.email !== e);
    lista.push({ token, email: e, criadoEm: Date.now(), usado: false });
    gravar(lista);
  }
  const link = isBrowser()
    ? `${window.location.origin}/redefinir-senha?token=${token}`
    : `/redefinir-senha?token=${token}`;
  return { ok: true, token, link, existe };
}

export function validarTokenRecuperacao(
  token: string,
): { ok: true; email: string } | { ok: false; erro: string } {
  const reg = ler().find((t) => t.token === token);
  if (!reg) return { ok: false, erro: "Link inválido ou inexistente." };
  if (reg.usado) return { ok: false, erro: "Este link já foi utilizado." };
  if (Date.now() - reg.criadoEm > TTL_MS) {
    return { ok: false, erro: "Link expirado. Solicite um novo." };
  }
  return { ok: true, email: reg.email };
}

export function redefinirSenhaComToken(
  token: string,
  novaSenha: string,
): { ok: true } | { ok: false; erro: string } {
  if (!novaSenha || novaSenha.length < 6) {
    return { ok: false, erro: "A senha precisa ter pelo menos 6 caracteres." };
  }
  const validacao = validarTokenRecuperacao(token);
  if (!validacao.ok) return validacao;

  const usuario = listarUsuarios().find(
    (u) => u.email.toLowerCase() === validacao.email,
  );
  if (!usuario) return { ok: false, erro: "Usuário não encontrado." };

  const r = atualizarUsuario(usuario.id, { senha: novaSenha });
  if (!r.ok) return r;

  const lista = ler().map((t) =>
    t.token === token ? { ...t, usado: true } : t,
  );
  gravar(lista);
  return { ok: true };
}
