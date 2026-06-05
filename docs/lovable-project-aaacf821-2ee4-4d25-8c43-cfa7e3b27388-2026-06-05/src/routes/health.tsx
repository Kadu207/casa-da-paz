import { createFileRoute } from "@tanstack/react-router";
import { PublicLayout } from "@/components/PublicLayout";

export const Route = createFileRoute("/health")({
  head: () => ({
    meta: [
      { title: "Status — Casa da Paz" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: HealthPage,
});

function HealthPage() {
  const now = new Date().toISOString();
  return (
    <PublicLayout>
      <section className="max-w-xl mx-auto px-4 py-10 sm:py-16">
        <div className="rounded-2xl bg-card border border-border/60 p-6 sm:p-8 shadow-lg text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-[color:var(--color-success)]/40 bg-background/40 px-4 py-1.5">
            <span className="h-2 w-2 rounded-full bg-[color:var(--color-success)] animate-pulse" />
            <span className="text-sm text-foreground/85">Portal operacional</span>
          </div>
          <h1 className="mt-6 font-serif text-3xl text-primary">
            Tudo certo por aqui
          </h1>
          <p className="mt-3 text-foreground/80 leading-relaxed">
            Servidor renderizando normalmente. Se você chegou nesta página depois
            de uma falha, role abaixo para ver o que fazer.
          </p>
          <dl className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3 text-left text-sm">
            <div className="rounded-xl bg-background/40 p-3">
              <dt className="text-foreground/55 text-xs uppercase tracking-wider">SSR</dt>
              <dd className="text-foreground/90 mt-1">Saudável</dd>
            </div>
            <div className="rounded-xl bg-background/40 p-3">
              <dt className="text-foreground/55 text-xs uppercase tracking-wider">Verificado em</dt>
              <dd className="text-foreground/90 mt-1 break-all">{now}</dd>
            </div>
          </dl>
        </div>

        <div className="mt-6 rounded-2xl border border-dashed border-border/60 p-5 sm:p-6">
          <h2 className="font-serif text-xl text-primary">
            Se a página não carregou da primeira vez
          </h2>
          <ol className="mt-3 list-decimal pl-5 space-y-2 text-sm text-foreground/80">
            <li>Toque em <strong>Recarregar página</strong> abaixo.</li>
            <li>Se persistir, force a atualização (Ctrl/Cmd + Shift + R).</li>
            <li>Ainda com problema? Fale com a Casa pelo WhatsApp.</li>
          </ol>
          <div className="mt-5 flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={() => {
                if (typeof window !== "undefined") window.location.reload();
              }}
              className="min-h-12 inline-flex items-center justify-center rounded-xl bg-primary text-primary-foreground font-medium px-5 py-3 hover:bg-primary/90 transition-colors"
            >
              Recarregar página
            </button>
            <a
              href="/contato"
              className="min-h-12 inline-flex items-center justify-center rounded-xl border border-primary text-primary font-medium px-5 py-3 hover:bg-primary/10 transition-colors"
            >
              Falar com a Casa
            </a>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
