/**
 * Testes "E2E" para o gate de /admin.
 *
 * Não rodamos um browser real (Playwright é opcional e fica para
 * execução manual na VPS), mas exercitamos o caminho completo do gate:
 * o `beforeLoad` do layout `_authenticated` é chamado com `supabase.auth`
 * e `meuPerfil` mockados, e verificamos o que ele faz para cada perfil
 * (anônimo, atendente sem papel staff, atendente válido, admin) em cada
 * rota administrativa.
 *
 * O gate é compartilhado por TODAS as rotas filhas de `_authenticated`
 * (/admin, /admin/eventos, /admin/eventos/novo, /admin/eventos/:id e
 * /admin/usuarios), então ele é o único ponto que precisa garantir o
 * 403 → /acesso-negado e o redirecionamento para /login. Se passar aqui,
 * passa em todas elas.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: { getUser: vi.fn() },
  },
}));

vi.mock("@/lib/auth.functions", () => ({
  meuPerfil: vi.fn(),
}));

import { supabase } from "@/integrations/supabase/client";
import { meuPerfil } from "@/lib/auth.functions";
import { Route as AuthenticatedRoute } from "@/routes/_authenticated";

type Resultado =
  | { tipo: "redirect"; to: string }
  | { tipo: "ok"; ctx: unknown }
  | { tipo: "erro"; erro: unknown };

async function executarGate(rota: string): Promise<Resultado> {
  // O TanStack chama beforeLoad com um contexto/location; passamos o mínimo
  // necessário. O `redirect()` do TanStack lança um objeto serializável que
  // contém `.to`. Validamos isso capturando a exception.
  try {
    const beforeLoad = AuthenticatedRoute.options.beforeLoad as (
      arg: { location: { pathname: string } },
    ) => Promise<unknown>;
    const ctx = await beforeLoad({ location: { pathname: rota } });
    return { tipo: "ok", ctx };
  } catch (e) {
    if (
      e &&
      typeof e === "object" &&
      ("to" in e || "href" in e || "options" in e)
    ) {
      const to =
        (e as { to?: string }).to ??
        (e as { options?: { to?: string } }).options?.to ??
        (e as { href?: string }).href ??
        "";
      return { tipo: "redirect", to };
    }
    return { tipo: "erro", erro: e };
  }
}

const ROTAS_ADMIN = [
  "/admin",
  "/admin/eventos",
  "/admin/eventos/novo",
  "/admin/eventos/123",
  "/admin/usuarios",
];

beforeEach(() => {
  vi.clearAllMocks();
});

describe("E2E: gate /admin para usuários sem permissão", () => {
  it("anônimo é redirecionado para /login em TODA rota /admin", async () => {
    (supabase.auth.getUser as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { user: null },
      error: null,
    });
    for (const rota of ROTAS_ADMIN) {
      const r = await executarGate(rota);
      expect(r.tipo, `rota ${rota}`).toBe("redirect");
      if (r.tipo === "redirect") expect(r.to).toBe("/login");
    }
    // meuPerfil nunca é chamado para anônimo (otimização)
    expect(meuPerfil).not.toHaveBeenCalled();
  });

  it("autenticado sem papel staff (403) é mandado para /acesso-negado em TODA rota /admin", async () => {
    (supabase.auth.getUser as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { user: { id: "u-sem-papel" } },
      error: null,
    });
    (meuPerfil as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Response("Acesso restrito.", { status: 403 }),
    );
    for (const rota of ROTAS_ADMIN) {
      const r = await executarGate(rota);
      expect(r.tipo, `rota ${rota}`).toBe("redirect");
      if (r.tipo === "redirect") expect(r.to).toBe("/acesso-negado");
    }
  });

  it("erros NÃO-403 do servidor (ex.: 500) NÃO viram /acesso-negado", async () => {
    (supabase.auth.getUser as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { user: { id: "u-erro" } },
      error: null,
    });
    (meuPerfil as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Response("boom", { status: 500 }),
    );
    const r = await executarGate("/admin/eventos");
    // O gate re-lança erros não-403; o errorComponent assume.
    expect(r.tipo).toBe("erro");
  });
});

describe("E2E: gate /admin para usuários autorizados", () => {
  it("atendente entra em /admin e /admin/eventos com papel='atendente'", async () => {
    (supabase.auth.getUser as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { user: { id: "u-atend" } },
      error: null,
    });
    (meuPerfil as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "u-atend",
      email: "a@a",
      nome: "A",
      papel: "atendente",
    });
    const r = await executarGate("/admin/eventos");
    expect(r.tipo).toBe("ok");
    if (r.tipo === "ok") {
      const ctx = r.ctx as { perfil: { papel: string } };
      expect(ctx.perfil.papel).toBe("atendente");
    }
  });

  it("admin entra em qualquer rota /admin com papel='admin'", async () => {
    (supabase.auth.getUser as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { user: { id: "u-admin" } },
      error: null,
    });
    (meuPerfil as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "u-admin",
      email: "x@x",
      nome: "X",
      papel: "admin",
    });
    for (const rota of ROTAS_ADMIN) {
      const r = await executarGate(rota);
      expect(r.tipo, `rota ${rota}`).toBe("ok");
    }
  });
});
