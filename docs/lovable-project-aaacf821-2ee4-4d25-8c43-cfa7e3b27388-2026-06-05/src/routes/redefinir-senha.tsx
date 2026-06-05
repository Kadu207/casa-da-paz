import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { PublicLayout } from "@/components/PublicLayout";
import {
  RouteErrorFallback,
  RouteNotFoundFallback,
} from "@/components/RouteFallbacks";
import {
  redefinirSenhaComToken,
  validarTokenRecuperacao,
} from "@/lib/password-reset-local";

type Search = { token?: string };

export const Route = createFileRoute("/redefinir-senha")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    token: typeof search.token === "string" ? search.token : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Redefinir senha — Casa da Paz" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: RedefinirSenhaPage,
  errorComponent: RouteErrorFallback,
  notFoundComponent: RouteNotFoundFallback,
});

function RedefinirSenhaPage() {
  const { token } = Route.useSearch();
  const navigate = useNavigate();
  const [email, setEmail] = useState<string | null>(null);
  const [erroToken, setErroToken] = useState<string | null>(null);
  const [senha, setSenha] = useState("");
  const [senha2, setSenha2] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);

  useEffect(() => {
    if (!token) {
      setErroToken("Link inválido: token ausente.");
      return;
    }
    const r = validarTokenRecuperacao(token);
    if (!r.ok) setErroToken(r.erro);
    else setEmail(r.email);
  }, [token]);

  const submeter = (e: FormEvent) => {
    e.preventDefault();
    setErro(null);
    if (!token) return;
    if (senha !== senha2) {
      setErro("As senhas não coincidem.");
      return;
    }
    const r = redefinirSenhaComToken(token, senha);
    if (!r.ok) {
      setErro(r.erro);
      return;
    }
    setSucesso(true);
    setTimeout(() => navigate({ to: "/login", replace: true }), 1500);
  };

  return (
    <PublicLayout>
      <section className="max-w-md mx-auto px-4 py-10 sm:py-14">
        <header>
          <p className="text-xs uppercase tracking-[0.25em] text-primary/80">
            Área restrita
          </p>
          <h1 className="mt-2 font-serif text-3xl sm:text-4xl text-primary">
            Redefinir senha
          </h1>
        </header>

        {erroToken ? (
          <div className="mt-6 rounded-2xl bg-card border border-border/60 p-5 space-y-3">
            <p
              role="alert"
              className="text-[color:var(--color-destructive)] text-sm"
            >
              {erroToken}
            </p>
            <Link
              to="/recuperar-senha"
              className="inline-block text-sm text-primary hover:underline"
            >
              Solicitar novo link
            </Link>
          </div>
        ) : sucesso ? (
          <div className="mt-6 rounded-2xl bg-card border border-border/60 p-5">
            <p className="text-foreground">
              Senha redefinida com sucesso. Redirecionando para o login…
            </p>
          </div>
        ) : (
          <form
            onSubmit={submeter}
            className="mt-6 rounded-2xl bg-card border border-border/60 p-5 sm:p-6 space-y-4"
            noValidate
          >
            {email && (
              <p className="text-sm text-foreground/80">
                Conta: <strong className="text-foreground">{email}</strong>
              </p>
            )}
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
                htmlFor="senha"
                className="block text-sm font-medium mb-1.5"
              >
                Nova senha
              </label>
              <input
                id="senha"
                type="password"
                autoComplete="new-password"
                required
                minLength={6}
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                className="w-full min-h-11 px-3.5 py-2.5 rounded-xl border border-border bg-background/40 text-foreground focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              />
            </div>
            <div>
              <label
                htmlFor="senha2"
                className="block text-sm font-medium mb-1.5"
              >
                Confirme a nova senha
              </label>
              <input
                id="senha2"
                type="password"
                autoComplete="new-password"
                required
                minLength={6}
                value={senha2}
                onChange={(e) => setSenha2(e.target.value)}
                className="w-full min-h-11 px-3.5 py-2.5 rounded-xl border border-border bg-background/40 text-foreground focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              />
            </div>
            <button
              type="submit"
              className="w-full min-h-11 inline-flex items-center justify-center rounded-xl bg-primary text-primary-foreground font-medium px-5 py-2.5 hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-card transition-colors"
            >
              Redefinir senha
            </button>
          </form>
        )}
      </section>
    </PublicLayout>
  );
}
