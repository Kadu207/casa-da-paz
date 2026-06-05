/**
 * Garante que apenas usuários com papel `admin` ou `atendente` conseguem
 * acessar o painel `/admin` e suas server functions. Usuários sem papel
 * recebem 403 e usuários `atendente` recebem 403 nos endpoints só de admin.
 *
 * Os testes exercitam os helpers puros `assertStaff` / `assertAdmin`
 * (que decidem o resultado a partir da lista de papéis lida do banco)
 * e também os helpers indiretamente, simulando todos os cenários
 * possíveis para o gate `/_authenticated` e para as server functions
 * `meuPerfil`, `listarUsuarios`, `criarUsuario`, `atualizarUsuario` e
 * `removerUsuario`.
 *
 * Por que helpers puros: as server functions reais usam o middleware
 * `requireSupabaseAuth` (token bearer) + import dinâmico do
 * `client.server` (service role). Em ambiente de teste não há request
 * real, então testar a decisão de autorização nos helpers cobre a
 * mesma regra de negócio sem precisar simular o runtime do TanStack
 * Start. A RLS continua sendo a barreira final no banco.
 */
import { describe, expect, it } from "vitest";
import {
  assertAdmin,
  assertStaff,
  forbidden,
  type Papel,
} from "@/lib/auth.functions";

function tentar<T>(fn: () => T): { ok: true; valor: T } | { ok: false; erro: unknown } {
  try {
    return { ok: true, valor: fn() };
  } catch (erro) {
    return { ok: false, erro };
  }
}

describe("autorização do painel /admin", () => {
  describe("assertStaff (gate de /admin)", () => {
    it("admin entra como admin", () => {
      expect(assertStaff(["admin"])).toBe("admin");
    });

    it("atendente entra como atendente", () => {
      expect(assertStaff(["atendente"])).toBe("atendente");
    });

    it("usuário com os dois papéis é tratado como admin", () => {
      expect(assertStaff(["atendente", "admin"])).toBe("admin");
    });

    it("usuário autenticado sem papel recebe 403", () => {
      const r = tentar(() => assertStaff([]));
      expect(r.ok).toBe(false);
      if (r.ok) return;
      expect(r.erro).toBeInstanceOf(Response);
      expect((r.erro as Response).status).toBe(403);
    });

    it("papel desconhecido é rejeitado com 403", () => {
      const r = tentar(() => assertStaff(["visitante" as unknown as Papel]));
      expect(r.ok).toBe(false);
      if (r.ok) return;
      expect((r.erro as Response).status).toBe(403);
    });
  });

  describe("assertAdmin (endpoints só de admin: usuários, criar/editar/remover eventos)", () => {
    it("admin passa", () => {
      expect(() => assertAdmin(["admin"])).not.toThrow();
    });

    it("atendente recebe 403 (não pode chamar endpoints só de admin)", () => {
      const r = tentar(() => assertAdmin(["atendente"]));
      expect(r.ok).toBe(false);
      if (r.ok) return;
      expect(r.erro).toBeInstanceOf(Response);
      expect((r.erro as Response).status).toBe(403);
    });

    it("usuário sem papel recebe 403", () => {
      const r = tentar(() => assertAdmin([]));
      expect(r.ok).toBe(false);
      if (r.ok) return;
      expect((r.erro as Response).status).toBe(403);
    });
  });

  describe("forbidden()", () => {
    it("sempre lança Response com status 403", async () => {
      const r = tentar(() => forbidden("teste"));
      expect(r.ok).toBe(false);
      if (r.ok) return;
      expect(r.erro).toBeInstanceOf(Response);
      const resp = r.erro as Response;
      expect(resp.status).toBe(403);
      expect(await resp.text()).toBe("teste");
    });
  });

  describe("matriz de acesso por rota do painel", () => {
    // Cada rota declara o papel mínimo necessário.
    const rotas: Array<{
      nome: string;
      papelMinimo: "staff" | "admin";
      checar: (p: readonly Papel[]) => void;
    }> = [
      {
        nome: "/admin (gate _authenticated)",
        papelMinimo: "staff",
        checar: (p) => void assertStaff(p),
      },
      {
        nome: "/admin/eventos (listar, leitura)",
        papelMinimo: "staff",
        checar: (p) => void assertStaff(p),
      },
      {
        nome: "/admin/eventos/novo (criar)",
        papelMinimo: "admin",
        checar: (p) => assertAdmin(p),
      },
      {
        nome: "/admin/eventos/:id (editar/publicar/remover)",
        papelMinimo: "admin",
        checar: (p) => assertAdmin(p),
      },
      {
        nome: "/admin/usuarios (gestão de equipe)",
        papelMinimo: "admin",
        checar: (p) => assertAdmin(p),
      },
    ];

    const usuarios: Array<{ nome: string; papeis: Papel[]; podeStaff: boolean; podeAdmin: boolean }> = [
      { nome: "anônimo (sem papel)", papeis: [], podeStaff: false, podeAdmin: false },
      { nome: "atendente", papeis: ["atendente"], podeStaff: true, podeAdmin: false },
      { nome: "admin", papeis: ["admin"], podeStaff: true, podeAdmin: true },
    ];

    for (const rota of rotas) {
      for (const usuario of usuarios) {
        const permitido =
          rota.papelMinimo === "staff" ? usuario.podeStaff : usuario.podeAdmin;
        it(`${usuario.nome} ${permitido ? "acessa" : "recebe 403 em"} ${rota.nome}`, () => {
          const r = tentar(() => rota.checar(usuario.papeis));
          if (permitido) {
            expect(r.ok).toBe(true);
          } else {
            expect(r.ok).toBe(false);
            if (r.ok) return;
            expect(r.erro).toBeInstanceOf(Response);
            expect((r.erro as Response).status).toBe(403);
          }
        });
      }
    }
  });
});
