import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { meuPapel } from "@/lib/auth.functions";

const SUPORTE_EMAIL = "contato@casadapaz.org.br";

type PapelDetectado = "anonimo" | "admin" | "atendente" | "nenhum";

export const Route = createFileRoute("/acesso-negado")({
  component: AcessoNegado,
  head: () => ({
    meta: [
      { title: "Acesso negado · Casa da Paz" },
      {
        name: "description",
        content:
          "Você não tem permissão para acessar esta área do painel da Casa da Paz.",
      },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
});

function descricaoPapel(p: PapelDetectado): string {
  switch (p) {
    case "anonimo":
      return "Visitante (não autenticado)";
    case "admin":
      return "Administrador";
    case "atendente":
      return "Atendente";
    case "nenhum":
      return "Usuário sem papel atribuído";
  }
}

function mensagemPapel(p: PapelDetectado): string {
  switch (p) {
    case "anonimo":
      return "Você precisa entrar com uma conta autorizada para acessar o painel.";
    case "admin":
      return "Sua conta tem papel de administrador, mas a rota solicitada não foi autorizada. Recarregue a página ou tente novamente após sair e entrar de novo.";
    case "atendente":
      return "Sua conta tem papel de atendente. Esta rota é restrita a administradores.";
    case "nenhum":
      return "Sua conta foi reconhecida, mas ainda não tem papel de administrador nem de atendente para entrar no painel.";
  }
}

function AcessoNegado() {
  const navigate = useNavigate();
  const [papel, setPapel] = useState<PapelDetectado | null>(null);
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    let cancelado = false;
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (cancelado) return;
      if (!data.user) {
        setPapel("anonimo");
        return;
      }
      try {
        const r = await meuPapel();
        if (!cancelado) setPapel(r.papel as PapelDetectado);
      } catch {
        if (!cancelado) setPapel("nenhum");
      }
    })();
    return () => {
      cancelado = true;
    };
  }, []);

  async function copiarEmail() {
    try {
      await navigator.clipboard.writeText(SUPORTE_EMAIL);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      // fallback: seleciona o texto para o usuário copiar manualmente
      const el = document.getElementById("suporte-email-texto");
      if (el) {
        const range = document.createRange();
        range.selectNodeContents(el);
        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(range);
      }
    }
  }

  async function sair() {
    await supabase.auth.signOut();
    navigate({ to: "/login", replace: true });
  }

  return (
    <main className="min-h-[80vh] bg-background text-foreground flex items-center justify-center px-4 py-16">
      <section
        role="alert"
        aria-labelledby="acesso-negado-titulo"
        className="w-full max-w-lg rounded-2xl border border-border/60 bg-card p-6 sm:p-8 shadow-sm"
      >
        <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--color-destructive)]">
          Erro 403 · Permissão necessária
        </p>
        <h1
          id="acesso-negado-titulo"
          className="mt-3 font-serif text-3xl sm:text-4xl text-primary"
        >
          Você não tem acesso ao painel
        </h1>

        <div
          data-testid="papel-detectado"
          aria-live="polite"
          className="mt-4 rounded-lg border border-border/60 bg-background/40 px-3 py-2 text-sm"
        >
          <span className="text-foreground/70">Sua identificação atual: </span>
          <strong className="text-foreground">
            {papel ? descricaoPapel(papel) : "Verificando…"}
          </strong>
        </div>

        <p className="mt-4 text-foreground/85">
          {papel ? mensagemPapel(papel) : "Estamos verificando suas permissões."}
        </p>

        <div className="mt-6 rounded-xl border border-border/60 bg-background/40 p-4 text-sm text-foreground/85">
          <p className="font-medium text-foreground">Precisa de acesso?</p>
          <p className="mt-1">
            Fale com a coordenação da Casa da Paz pelo e-mail abaixo. Informe
            seu nome completo e o e-mail usado no login para que a equipe possa
            liberar seu acesso.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <a
              href={`mailto:${SUPORTE_EMAIL}?subject=${encodeURIComponent(
                "Solicitação de acesso ao painel",
              )}`}
              id="suporte-email-texto"
              className="font-mono text-sm text-primary hover:underline focus-visible:underline"
            >
              {SUPORTE_EMAIL}
            </a>
            <button
              type="button"
              onClick={copiarEmail}
              data-testid="copiar-email-suporte"
              aria-label="Copiar e-mail de suporte"
              className="min-h-9 inline-flex items-center justify-center rounded-lg border border-border px-3 py-1.5 text-xs hover:bg-primary/10 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              {copiado ? "✓ Copiado" : "Copiar e-mail"}
            </button>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Link
            to="/"
            className="min-h-11 inline-flex items-center justify-center rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background transition-colors"
          >
            ← Voltar ao site público
          </Link>
          {papel !== "anonimo" ? (
            <button
              type="button"
              onClick={sair}
              className="min-h-11 inline-flex items-center justify-center rounded-xl border border-border px-5 py-2.5 text-sm hover:bg-primary/10 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              Sair e entrar com outra conta
            </button>
          ) : (
            <Link
              to="/login"
              className="min-h-11 inline-flex items-center justify-center rounded-xl border border-border px-5 py-2.5 text-sm hover:bg-primary/10 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              Entrar
            </Link>
          )}
        </div>
      </section>
    </main>
  );
}
