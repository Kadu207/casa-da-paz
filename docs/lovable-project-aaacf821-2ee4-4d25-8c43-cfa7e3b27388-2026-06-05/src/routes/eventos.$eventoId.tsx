import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicLayout } from "@/components/PublicLayout";
import { RouteErrorFallback, RouteNotFoundFallback } from "@/components/RouteFallbacks";
import { ShareEvento } from "@/components/ShareEvento";
import {
  formatEventoDay,
  formatEventoHour,
} from "@/data/eventos";
import { buscarEventoPorSlug, useEvento, type Evento } from "@/lib/eventos-store";
import { downloadIcs } from "@/lib/ics";

export const Route = createFileRoute("/eventos/$eventoId")({
  loader: async ({ params }) => {
    // Carregado isomorficamente via Supabase (RLS deixa anônimos lerem só publicados).
    try {
      const evento = await buscarEventoPorSlug(params.eventoId);
      return { evento };
    } catch {
      return { evento: null as Evento | null };
    }
  },
  head: ({ loaderData, params }) => {
    const title = loaderData?.evento
      ? `${loaderData.evento.nomeEvento} — Casa da Paz`
      : "Evento — Casa da Paz";
    const description = loaderData?.evento?.resumo ?? "Evento na Casa da Paz.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "article" },
        { property: "og:url", content: `/eventos/${params.eventoId}` },
        { name: "twitter:card", content: "summary_large_image" },
      ],
      links: [{ rel: "canonical", href: `/eventos/${params.eventoId}` }],
    };
  },
  component: EventoDetalhePage,
  errorComponent: RouteErrorFallback,
  notFoundComponent: RouteNotFoundFallback,
});

function EventoDetalhePage() {
  const { eventoId } = Route.useParams();
  const { evento: eventoLoader } = Route.useLoaderData();
  const { data: eventoQuery, isLoading } = useEvento(eventoId);
  const evento = eventoQuery ?? eventoLoader;

  if (!evento) {
    return (
      <PublicLayout>
        <section className="max-w-2xl mx-auto px-4 py-12 text-center">
          <h1 className="font-serif text-2xl text-primary">
            {isLoading ? "Carregando evento…" : "Evento não encontrado"}
          </h1>
          {!isLoading && (
            <>
              <p className="mt-3 text-foreground/80">
                Esse evento pode ter sido removido ou ainda não foi publicado.
              </p>
              <Link
                to="/eventos"
                className="mt-6 inline-block text-primary hover:underline"
              >
                ← Ver todos os eventos
              </Link>
            </>
          )}
        </section>
      </PublicLayout>
    );
  }
  const mensagem =
    `Olá! Gostaria de participar do evento "${evento.nomeEvento}" no dia ${formatEventoDay(
      evento.dataEvento,
    )} às ${formatEventoHour(evento.dataEvento)}.`;
  const whatsapp = `https://wa.me/5531900000000?text=${encodeURIComponent(mensagem)}`;
  const agendarHref = `/agendar?evento=${encodeURIComponent(evento.id)}`;

  return (
    <PublicLayout>
      <article className="max-w-2xl mx-auto px-4 py-8 sm:py-12">
        <Link
          to="/eventos"
          className="text-sm text-foreground/80 hover:text-primary focus-visible:text-primary"
        >
          ← Todos os eventos
        </Link>

        <header className="mt-4">
          <p className="text-xs sm:text-sm uppercase tracking-[0.2em] text-primary/85">
            Evento
          </p>
          <h1 className="mt-2 font-serif text-3xl sm:text-4xl text-primary">
            {evento.nomeEvento}
          </h1>
          <p className="mt-3 text-foreground/85">{evento.resumo}</p>
        </header>

        <dl className="mt-6 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl bg-card border border-border/60 p-4">
            <dt className="text-xs uppercase tracking-wider text-foreground/70">
              Data
            </dt>
            <dd className="mt-1 text-foreground first-letter:uppercase">
              {formatEventoDay(evento.dataEvento)}
            </dd>
          </div>
          <div className="rounded-xl bg-card border border-border/60 p-4">
            <dt className="text-xs uppercase tracking-wider text-foreground/70">
              Horário
            </dt>
            <dd className="mt-1 text-foreground">
              {formatEventoHour(evento.dataEvento)}
            </dd>
          </div>
          <div className="rounded-xl bg-card border border-border/60 p-4 sm:col-span-2">
            <dt className="text-xs uppercase tracking-wider text-foreground/70">
              Local
            </dt>
            <dd className="mt-1 text-foreground">{evento.local}</dd>
          </div>
          {evento.capacidadeMax != null && evento.inscricoes != null && (
            <div className="rounded-xl bg-card border border-border/60 p-4 sm:col-span-2">
              <dt className="text-xs uppercase tracking-wider text-foreground/70">
                Vagas
              </dt>
              <dd className="mt-1 text-foreground">
                {evento.inscricoes} inscritos · {evento.capacidadeMax} no total
              </dd>
            </div>
          )}
        </dl>

        <section className="mt-8">
          <h2 className="font-serif text-2xl text-primary">Sobre o trabalho</h2>
          <div className="mt-3 space-y-3 text-foreground/90 leading-relaxed">
            {evento.descricao.map((p: string, i: number) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        </section>

        {evento.recomendacoes && evento.recomendacoes.length > 0 && (
          <section className="mt-8">
            <h2 className="font-serif text-2xl text-primary">Recomendações</h2>
            <ul className="mt-3 list-disc pl-5 space-y-1.5 text-foreground/90">
              {evento.recomendacoes.map((r: string, i: number) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          </section>
        )}

        <section className="mt-10 rounded-2xl bg-card border border-border/60 p-5 sm:p-6">
          <h2 className="font-serif text-xl text-primary">Quer participar?</h2>
          <p className="mt-2 text-foreground/85">
            Fale com a Casa pelo WhatsApp ou solicite um agendamento de consulta
            relacionada a este trabalho.
          </p>
          <div className="mt-4 flex flex-col sm:flex-row flex-wrap gap-3">
            <a
              href={whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="min-h-12 inline-flex items-center justify-center rounded-xl bg-primary text-primary-foreground font-medium px-6 py-3 hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background transition-colors shadow"
            >
              Falar no WhatsApp
            </a>
            <a
              href={agendarHref}
              className="min-h-12 inline-flex items-center justify-center rounded-xl border border-primary text-primary font-medium px-6 py-3 hover:bg-primary/10 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background transition-colors"
            >
              Agendar consulta
            </a>
            <button
              type="button"
              onClick={() =>
                downloadIcs(
                  {
                    uid: evento.id,
                    title: evento.nomeEvento,
                    description: `${evento.resumo}\n\n${evento.descricao.join("\n\n")}`,
                    location: evento.local,
                    start: evento.dataEvento,
                    durationMinutes: 120,
                  },
                  `${evento.id}.ics`,
                )
              }
              className="min-h-12 inline-flex items-center justify-center rounded-xl border border-border text-foreground font-medium px-6 py-3 hover:border-primary hover:text-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background transition-colors"
              aria-label={`Adicionar ${evento.nomeEvento} ao calendário`}
            >
              📅 Adicionar ao calendário
            </button>
          </div>
          <p className="mt-3 text-xs text-foreground/65">
            Baixa um arquivo .ics compatível com Google Calendar, Apple
            Calendar e Outlook.
          </p>

          <div className="mt-6 pt-5 border-t border-border/60">
            <p className="text-xs uppercase tracking-wider text-foreground/70 mb-2">
              Compartilhar
            </p>
            <ShareEvento
              title={evento.nomeEvento}
              text={`${evento.nomeEvento} — ${evento.resumo}`}
              path={`/eventos/${evento.id}`}
            />
          </div>
        </section>
      </article>
    </PublicLayout>
  );
}
