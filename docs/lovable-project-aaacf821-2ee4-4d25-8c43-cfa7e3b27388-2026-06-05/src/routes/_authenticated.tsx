import {
  createFileRoute,
  Link,
  Outlet,
  redirect,
  useNavigate,
} from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { meuPerfil } from "@/lib/auth.functions";
import {
  RouteErrorFallback,
  RouteNotFoundFallback,
} from "@/components/RouteFallbacks";

type Perfil = {
  nome: string;
  email: string;
  papel: "admin" | "atendente";
};

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      throw redirect({ to: "/login" });
    }
    // Validação de papel server-side: meuPerfil lança 403 se o usuário
    // não for admin nem atendente. Não dá para burlar via DevTools porque
    // a checagem ocorre no servidor com a service role.
    try {
      const perfil = await meuPerfil();
      return { user: data.user, perfil };
    } catch (e) {
      // 403 vindo do servidor: usuário autenticado mas sem papel de staff.
      if (e instanceof Response && e.status === 403) {
        throw redirect({ to: "/acesso-negado" });
      }
      throw e;
    }
  },
  component: AdminLayout,
  errorComponent: RouteErrorFallback,
  notFoundComponent: RouteNotFoundFallback,
});

function AdminLayout() {
  const navigate = useNavigate();
  const { perfil: perfilInicial } = Route.useRouteContext();
  const [perfil, setPerfil] = useState<Perfil>(perfilInicial);

  useEffect(() => {
    let cancelado = false;
    meuPerfil()
      .then((p) => !cancelado && setPerfil(p))
      .catch((e) => {
        if (e instanceof Response && e.status === 403) {
          navigate({ to: "/acesso-negado", replace: true });
        } else {
          navigate({ to: "/login", replace: true });
        }
      });
    return () => {
      cancelado = true;
    };
  }, [navigate]);


  return (
    <div className="min-h-screen bg-background text-foreground">
      <a
        href="#admin-conteudo"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 bg-primary text-primary-foreground px-3 py-2 rounded-md"
      >
        Pular para o conteúdo
      </a>
      <header className="border-b border-border/60 bg-card/60">
        <div className="max-w-5xl mx-auto px-4 py-3 flex flex-wrap items-center gap-3">
          <Link
            to="/admin"
            className="font-serif text-lg text-primary hover:text-primary/80"
          >
            Casa da Paz · Painel
          </Link>
          <nav
            aria-label="Navegação do painel"
            className="ml-auto flex flex-wrap items-center gap-3 text-sm"
          >
            <Link
              to="/admin"
              activeOptions={{ exact: true }}
              activeProps={{ className: "text-primary font-medium" }}
              className="hover:text-primary focus-visible:text-primary"
            >
              Início
            </Link>
            <Link
              to="/admin/eventos"
              activeProps={{ className: "text-primary font-medium" }}
              className="hover:text-primary focus-visible:text-primary"
            >
              Eventos
            </Link>
            {perfil.papel === "admin" && (
              <>
                <Link
                  to="/admin/usuarios"
                  activeProps={{ className: "text-primary font-medium" }}
                  className="hover:text-primary focus-visible:text-primary"
                >
                  Equipe
                </Link>
                <Link
                  to="/admin/auditoria"
                  activeProps={{ className: "text-primary font-medium" }}
                  className="hover:text-primary focus-visible:text-primary"
                >
                  Auditoria
                </Link>
              </>
            )}

            <Link
              to="/"
              className="hover:text-primary focus-visible:text-primary"
            >
              Ver site
            </Link>
            <span className="hidden sm:inline text-foreground/60">
              {perfil.nome || perfil.email} ·{" "}
              <span className="uppercase text-xs tracking-wider">
                {perfil.papel}
              </span>
            </span>
            <button
              type="button"
              onClick={async () => {
                await supabase.auth.signOut();
                navigate({ to: "/login", replace: true });
              }}
              className="min-h-9 inline-flex items-center justify-center rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-primary/10 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              Sair
            </button>
          </nav>
        </div>
      </header>
      <main id="admin-conteudo" className="max-w-5xl mx-auto px-4 py-8 sm:py-10">
        <Outlet />
      </main>
    </div>
  );
}
