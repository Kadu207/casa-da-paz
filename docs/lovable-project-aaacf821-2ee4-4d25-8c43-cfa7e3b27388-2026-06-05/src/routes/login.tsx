import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { PublicLayout } from "@/components/PublicLayout";
import {
  RouteErrorFallback,
  RouteNotFoundFallback,
} from "@/components/RouteFallbacks";
import { supabase } from "@/integrations/supabase/client";
import { bootstrapAdmin } from "@/lib/auth.functions";
import pretoVelho from "@/assets/preto-velho.jpg.asset.json";
import { SafeImage, buildSrcSet } from "@/components/SafeImage";

type Search = { redirect?: string };

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    redirect:
      typeof search.redirect === "string" ? search.redirect : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Entrar — Casa da Paz" },
      {
        name: "description",
        content:
          "Área restrita da equipe da Casa da Paz para gestão interna.",
      },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: LoginPage,
  errorComponent: RouteErrorFallback,
  notFoundComponent: RouteNotFoundFallback,
});

function LoginPage() {
  const navigate = useNavigate();
  const { redirect } = useSearch({ from: "/login" });
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [bootstrap, setBootstrap] = useState<{
    email: string;
    senhaProvisoria: string;
  } | null>(null);
  const [bootstrapErro, setBootstrapErro] = useState<string | null>(null);

  // Se já estiver logado, manda direto pro painel.
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: redirect ?? "/admin", replace: true });
    });
  }, [navigate, redirect]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErro(null);
    setCarregando(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password: senha,
    });
    setCarregando(false);
    if (error) {
      setErro("E-mail ou senha inválidos.");
      return;
    }
    navigate({ to: redirect ?? "/admin", replace: true });
  };

  const onBootstrap = async () => {
    setBootstrapErro(null);
    try {
      const res = await bootstrapAdmin({
        data: { email: "inovatidev@gmail.com" },
      });
      setBootstrap(res);
    } catch (err) {
      setBootstrapErro(
        err instanceof Error ? err.message : "Falha ao inicializar admin.",
      );
    }
  };

  return (
    <PublicLayout>
      <section className="relative max-w-md mx-auto px-4 py-10 sm:py-14">
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <SafeImage
            src={pretoVelho.url}
            alt=""
            aria-hidden="true"
            width={1024}
            height={768}
            fallbackLabel=""
            className="h-full w-full object-cover opacity-20"
            srcSet={buildSrcSet(pretoVelho.url, [320, 640, 960, 1280])}
            sizes="(min-width: 640px) 448px, 100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background via-background/70 to-background" />
        </div>
        <header>
          <p className="text-xs sm:text-sm uppercase tracking-[0.25em] text-primary/80">
            Área restrita
          </p>
          <h1 className="mt-2 font-serif text-3xl sm:text-4xl text-primary">
            Entrar
          </h1>
          <p className="mt-3 text-foreground/80 text-sm">
            Acesso da equipe da Casa para gestão interna.
          </p>
        </header>

        <form
          onSubmit={onSubmit}
          className="mt-6 rounded-2xl bg-card border border-border/60 p-5 sm:p-6 space-y-4"
          noValidate
        >
          {erro && (
            <div
              role="alert"
              className="rounded-xl border border-[color:var(--color-destructive)]/60 bg-[color:var(--color-destructive)]/10 text-[color:var(--color-destructive)] px-4 py-3 text-sm"
            >
              {erro}
            </div>
          )}

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-foreground mb-1.5"
            >
              E-mail
            </label>
            <input
              id="email"
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full min-h-11 px-3.5 py-2.5 rounded-xl border border-border bg-background/40 text-foreground placeholder:text-foreground/45 focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            />
          </div>

          <div>
            <label
              htmlFor="senha"
              className="block text-sm font-medium text-foreground mb-1.5"
            >
              Senha
            </label>
            <input
              id="senha"
              type="password"
              autoComplete="current-password"
              required
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              className="w-full min-h-11 px-3.5 py-2.5 rounded-xl border border-border bg-background/40 text-foreground focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            />
          </div>

          <button
            type="submit"
            disabled={carregando}
            className="w-full min-h-11 inline-flex items-center justify-center rounded-xl bg-primary text-primary-foreground font-medium px-5 py-2.5 hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-card transition-colors disabled:opacity-60"
          >
            {carregando ? "Entrando…" : "Entrar"}
          </button>
        </form>

        <details className="mt-6 rounded-xl border border-border/60 bg-card/60 p-4 text-sm">
          <summary className="cursor-pointer text-foreground/85">
            Primeira vez? Inicializar administrador
          </summary>
          <div className="mt-3 space-y-3 text-foreground/80">
            <p>
              Cria a conta administradora <code>inovatidev@gmail.com</code> com
              uma senha provisória que aparecerá abaixo. Use-a apenas no
              primeiro acesso e troque depois.
            </p>
            {bootstrap ? (
              <div className="rounded-xl border border-primary/40 bg-primary/10 px-4 py-3 text-sm">
                <p>
                  <strong>Conta criada.</strong>
                </p>
                <p className="mt-1">
                  <strong>E-mail:</strong>{" "}
                  <code className="select-all">{bootstrap.email}</code>
                </p>
                <p className="mt-1">
                  <strong>Senha provisória:</strong>{" "}
                  <code className="select-all break-all">
                    {bootstrap.senhaProvisoria}
                  </code>
                </p>
                <p className="mt-2 text-xs text-foreground/70">
                  Anote agora — não vamos exibir novamente.
                </p>
              </div>
            ) : (
              <>
                {bootstrapErro && (
                  <p className="rounded-lg border border-[color:var(--color-destructive)]/50 bg-[color:var(--color-destructive)]/10 text-[color:var(--color-destructive)] px-3 py-2 text-xs">
                    {bootstrapErro}
                  </p>
                )}
                <button
                  type="button"
                  onClick={onBootstrap}
                  className="min-h-10 inline-flex items-center justify-center rounded-lg border border-border px-4 py-2 text-sm hover:bg-primary/10"
                >
                  Inicializar admin
                </button>
              </>
            )}
          </div>
        </details>

        <p className="mt-6 text-sm text-foreground/75">
          <Link to="/" className="hover:text-primary focus-visible:text-primary">
            ← Voltar para a Casa
          </Link>
        </p>
      </section>
    </PublicLayout>
  );
}
