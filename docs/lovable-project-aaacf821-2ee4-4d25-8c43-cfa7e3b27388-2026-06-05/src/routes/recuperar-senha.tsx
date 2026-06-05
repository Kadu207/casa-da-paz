import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { PublicLayout } from "@/components/PublicLayout";
import {
  RouteErrorFallback,
  RouteNotFoundFallback,
} from "@/components/RouteFallbacks";
import { solicitarRecuperacao } from "@/lib/password-reset-local";

export const Route = createFileRoute("/recuperar-senha")({
  head: () => ({
    meta: [
      { title: "Recuperar senha — Casa da Paz" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: RecuperarSenhaPage,
  errorComponent: RouteErrorFallback,
  notFoundComponent: RouteNotFoundFallback,
});

function RecuperarSenhaPage() {
  const [email, setEmail] = useState("");
  const [enviado, setEnviado] = useState(false);
  const [linkDev, setLinkDev] = useState<string | null>(null);

  const submeter = (e: FormEvent) => {
    e.preventDefault();
    const r = solicitarRecuperacao(email);
    if (r.ok) {
      setEnviado(true);
      // No modo front-only, mostramos o link diretamente em vez de enviar e-mail.
      // Quando o backend assumir, o link será enviado por e-mail e este aviso some.
      setLinkDev(r.existe ? r.link : null);
    }
  };

  return (
    <PublicLayout>
      <section className="max-w-md mx-auto px-4 py-10 sm:py-14">
        <header>
          <p className="text-xs uppercase tracking-[0.25em] text-primary/80">
            Área restrita
          </p>
          <h1 className="mt-2 font-serif text-3xl sm:text-4xl text-primary">
            Recuperar senha
          </h1>
          <p className="mt-3 text-foreground/80 text-sm">
            Informe seu e-mail cadastrado para receber um link de redefinição.
          </p>
        </header>

        {!enviado ? (
          <form
            onSubmit={submeter}
            className="mt-6 rounded-2xl bg-card border border-border/60 p-5 sm:p-6 space-y-4"
            noValidate
          >
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
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full min-h-11 px-3.5 py-2.5 rounded-xl border border-border bg-background/40 text-foreground focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              />
            </div>
            <button
              type="submit"
              className="w-full min-h-11 inline-flex items-center justify-center rounded-xl bg-primary text-primary-foreground font-medium px-5 py-2.5 hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-card transition-colors"
            >
              Enviar link de redefinição
            </button>
          </form>
        ) : (
          <div className="mt-6 rounded-2xl bg-card border border-border/60 p-5 sm:p-6 space-y-3">
            <p className="text-foreground">
              Se este e-mail estiver cadastrado, enviaremos um link para
              redefinir a senha. Verifique sua caixa de entrada e a pasta de
              spam.
            </p>
            {linkDev && (
              <div
                role="note"
                className="rounded-xl border border-border/60 bg-background/50 p-4 text-xs text-foreground/80 space-y-2"
              >
                <p className="font-medium text-foreground">
                  🧩 Modo front-only (Cursor irá substituir por envio real):
                </p>
                <p>Use este link para redefinir a senha agora:</p>
                <a
                  href={linkDev}
                  className="block break-all text-primary hover:underline"
                >
                  {linkDev}
                </a>
              </div>
            )}
            <Link
              to="/login"
              className="inline-block text-sm text-primary hover:underline"
            >
              ← Voltar para o login
            </Link>
          </div>
        )}
      </section>
    </PublicLayout>
  );
}
