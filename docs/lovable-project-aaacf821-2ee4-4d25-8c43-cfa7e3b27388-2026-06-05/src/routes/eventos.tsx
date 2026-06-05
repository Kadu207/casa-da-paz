import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { PublicLayout } from "@/components/PublicLayout";
import { RouteErrorFallback, RouteNotFoundFallback } from "@/components/RouteFallbacks";
import velasAltar from "@/assets/velas-altar.jpg.asset.json";
import { SafeImage, buildSrcSet } from "@/components/SafeImage";
import { formatEventoDate } from "@/data/eventos";
import { useEventosPublicados } from "@/lib/eventos-store";
import { downloadIcsCalendar } from "@/lib/ics";

const PAGE_SIZE = 5;

type EventosSearch = {
  q?: string;
  de?: string;
  ate?: string;
};

export const Route = createFileRoute("/eventos")({
  validateSearch: (search: Record<string, unknown>): EventosSearch => ({
    q: typeof search.q === "string" ? search.q.slice(0, 80) : undefined,
    de: typeof search.de === "string" ? search.de.slice(0, 10) : undefined,
    ate: typeof search.ate === "string" ? search.ate.slice(0, 10) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Próximos eventos — Casa da Paz" },
      {
        name: "description",
        content:
          "Giras, oficinas e celebrações abertas à comunidade na Casa da Paz, em Conselheiro Lafaiete, MG.",
      },
      { property: "og:title", content: "Próximos eventos — Casa da Paz" },
      {
        property: "og:description",
        content: "Giras e oficinas abertas à comunidade.",
      },
      { property: "og:url", content: "/eventos" },
      { property: "og:type", content: "website" },
    ],
    links: [
      { rel: "canonical", href: "/eventos" },
      // Preload do banner (acima da dobra) para melhorar o LCP.
      {
        rel: "preload",
        as: "image",
        href: velasAltar.url,
        fetchpriority: "high",
      },
    ],
  }),
  component: EventosPage,
  errorComponent: RouteErrorFallback,
  notFoundComponent: RouteNotFoundFallback,
});

function EventosPage() {
  const { q = "", de = "", ate = "" } = Route.useSearch();
  const navigate = useNavigate({ from: "/eventos" });
  const { data: eventos = [] } = useEventosPublicados();

  const filtrados = useMemo(() => {
    const term = q.trim().toLowerCase();
    const inicio = de ? new Date(de + "T00:00:00").getTime() : null;
    const fim = ate ? new Date(ate + "T23:59:59").getTime() : null;

    return eventos.filter((ev) => {
      const dataMs = new Date(ev.dataEvento).getTime();
      if (inicio !== null && dataMs < inicio) return false;
      if (fim !== null && dataMs > fim) return false;
      if (term) {
        const haystack = `${ev.nomeEvento} ${ev.resumo} ${ev.descricao.join(" ")}`.toLowerCase();
        if (!haystack.includes(term)) return false;
      }
      return true;
    });
  }, [q, de, ate, eventos]);

  const [visiveis, setVisiveis] = useState(PAGE_SIZE);
  // Reseta paginação quando filtros mudam
  useEffect(() => {
    setVisiveis(PAGE_SIZE);
  }, [q, de, ate]);

  const visiveisLista = filtrados.slice(0, visiveis);
  const hasMore = visiveis < filtrados.length;

  const baixarTodos = () => {
    if (filtrados.length === 0) return;
    downloadIcsCalendar(
      filtrados.map((ev) => ({
        uid: ev.id,
        title: ev.nomeEvento,
        description: `${ev.resumo}\n\n${ev.descricao.join("\n\n")}`,
        location: ev.local,
        start: ev.dataEvento,
        durationMinutes: 120,
      })),
      "eventos-casa-da-paz.ics",
    );
  };

  const updateSearch = (patch: Partial<EventosSearch>) => {
    navigate({
      search: (prev: EventosSearch) => {
        const next = { ...prev, ...patch };
        // Limpa chaves vazias para manter URL enxuta
        (Object.keys(next) as (keyof EventosSearch)[]).forEach((k) => {
          if (!next[k]) delete next[k];
        });
        return next;
      },
      replace: true,
    });
  };

  const hasFilter = Boolean(q || de || ate);

  return (
    <PublicLayout>
      <section className="relative h-44 sm:h-56 overflow-hidden">
        <SafeImage
          src={velasAltar.url}
          alt=""
          width={1280}
          height={720}
          loading="eager"
          fetchPriority="high"
          fallbackLabel="Velas no altar"
          className="h-full w-full object-cover"
          srcSet={buildSrcSet(velasAltar.url, [640, 960, 1280, 1920])}
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/70 to-background" />
        <div className="absolute inset-0 flex items-end">
          <div className="max-w-3xl mx-auto w-full px-4 pb-5">
            <h1 className="font-serif text-3xl sm:text-4xl text-primary">
              Próximos eventos
            </h1>
            <p className="text-foreground/80 text-sm mt-1">
              Giras e oficinas abertas à comunidade
            </p>
          </div>
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-4 py-6 sm:py-8">
        <form
          role="search"
          aria-label="Filtrar eventos"
          onSubmit={(e) => e.preventDefault()}
          className="rounded-2xl bg-card border border-border/60 p-4 sm:p-5 shadow-sm space-y-3"
        >
          <div>
            <label htmlFor="busca" className="block text-sm font-medium text-foreground mb-1.5">
              Buscar
            </label>
            <input
              id="busca"
              type="search"
              inputMode="search"
              placeholder="Caboclos, ervas, pretos velhos…"
              value={q}
              onChange={(e) => updateSearch({ q: e.target.value })}
              className="w-full min-h-11 px-3.5 py-2.5 rounded-xl border border-border bg-background/40 text-foreground placeholder:text-foreground/45 focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="de" className="block text-sm font-medium text-foreground mb-1.5">
                A partir de
              </label>
              <input
                id="de"
                type="date"
                value={de}
                onChange={(e) => updateSearch({ de: e.target.value })}
                className="w-full min-h-11 px-3.5 py-2.5 rounded-xl border border-border bg-background/40 text-foreground focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              />
            </div>
            <div>
              <label htmlFor="ate" className="block text-sm font-medium text-foreground mb-1.5">
                Até
              </label>
              <input
                id="ate"
                type="date"
                value={ate}
                onChange={(e) => updateSearch({ ate: e.target.value })}
                className="w-full min-h-11 px-3.5 py-2.5 rounded-xl border border-border bg-background/40 text-foreground focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              />
            </div>
          </div>
          {hasFilter && (
            <div className="flex items-center justify-between gap-3 pt-1">
              <p className="text-xs text-foreground/75" aria-live="polite">
                {filtrados.length}{" "}
                {filtrados.length === 1 ? "evento encontrado" : "eventos encontrados"}
              </p>
              <button
                type="button"
                onClick={() => navigate({ search: {}, replace: true })}
                className="min-h-9 text-sm text-primary hover:underline focus-visible:underline px-2"
              >
                Limpar filtros
              </button>
            </div>
          )}
        </form>
      </section>

      <section className="max-w-3xl mx-auto px-4 pb-8">
        {filtrados.length === 0 ? (
          <div className="rounded-2xl bg-card border border-border/60 p-8 text-center text-foreground/85">
            <p className="font-serif text-lg text-primary">
              Nenhum evento encontrado
            </p>
            <p className="mt-2 text-sm text-foreground/75">
              Ajuste os filtros ou veja todos os eventos disponíveis.
            </p>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <p className="text-sm text-foreground/75" aria-live="polite">
                Mostrando {visiveisLista.length} de {filtrados.length}
              </p>
              <button
                type="button"
                onClick={baixarTodos}
                className="min-h-10 inline-flex items-center justify-center rounded-xl border border-primary text-primary text-sm font-medium px-4 py-2 hover:bg-primary/10 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background transition-colors"
                aria-label="Baixar todos os eventos filtrados em arquivo .ics"
              >
                📅 Baixar .ics ({filtrados.length})
              </button>
            </div>
            <ul className="space-y-4">
              {visiveisLista.map((ev) => (
                <li key={ev.id}>
                  <Link
                    to="/eventos/$eventoId"
                    params={{ eventoId: ev.id }}
                    className="block rounded-2xl bg-card border border-border/60 p-5 sm:p-6 shadow-sm hover:border-primary/60 focus-visible:border-primary transition-colors"
                  >
                    <h2 className="font-serif text-xl sm:text-2xl text-primary">
                      {ev.nomeEvento}
                    </h2>
                    <p className="mt-1 text-foreground/85 first-letter:uppercase">
                      {formatEventoDate(ev.dataEvento)}
                    </p>
                    <p className="mt-2 text-sm text-foreground/80">{ev.resumo}</p>
                    {ev.capacidadeMax != null && ev.inscricoes != null && (
                      <p className="mt-3 text-xs uppercase tracking-wider text-foreground/70">
                        {ev.inscricoes}/{ev.capacidadeMax} inscritos
                      </p>
                    )}
                    <span className="mt-3 inline-block text-sm text-primary">
                      Ver detalhes →
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
            {hasMore && (
              <div className="mt-6 flex justify-center">
                <button
                  type="button"
                  onClick={() => setVisiveis((v) => v + PAGE_SIZE)}
                  className="min-h-11 inline-flex items-center justify-center rounded-xl bg-primary text-primary-foreground font-medium px-6 py-3 hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background transition-colors shadow"
                >
                  Carregar mais ({filtrados.length - visiveis} restantes)
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </PublicLayout>
  );
}
