import { Link, useSearchParams } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { PublicLayout } from '../../components/public/PublicLayout';
import { SafeImage, buildSrcSet } from '../../components/public/SafeImage';
import { portalAssets } from '../../lib/portal-assets';
import { api } from '../../lib/api';
import { useI18n } from '../../i18n/I18nContext';

interface Evento {
  id: number;
  nomeEvento: string;
  dataEvento: string;
  capacidadeMax: number | null;
  visualizacoes?: number;
  _count: { inscricoes: number };
}

const API_BASE = import.meta.env.VITE_API_URL ?? '/api';
const PAGE_SIZE = 5;

function EventoCard({
  ev,
  labelSubs,
  labelDetails,
}: {
  ev: Evento;
  labelSubs: string;
  labelDetails: string;
}) {
  useEffect(() => {
    fetch(`${API_BASE}/public/eventos/${ev.id}/view`, { method: 'POST' }).catch(() => {});
  }, [ev.id]);

  return (
    <li className="rounded-2xl bg-card border border-border/60 p-5 sm:p-6 shadow-sm">
      <h2 className="font-serif text-xl sm:text-2xl text-primary">{ev.nomeEvento}</h2>
      <p className="mt-1 text-foreground/85 capitalize">
        {new Date(ev.dataEvento).toLocaleDateString('pt-BR', {
          weekday: 'long',
          day: '2-digit',
          month: 'long',
          year: 'numeric',
        })}
      </p>
      {ev.capacidadeMax != null && (
        <p className="mt-3 text-xs uppercase tracking-wider text-foreground/70">
          {ev._count.inscricoes}/{ev.capacidadeMax} {labelSubs}
        </p>
      )}
      <Link
        to={`/public/eventos/${ev.id}`}
        className="mt-4 inline-flex min-h-10 items-center text-sm font-medium text-primary hover:underline"
      >
        {labelDetails} →
      </Link>
    </li>
  );
}

export default function PublicEventos() {
  const { t } = useI18n();
  const [searchParams, setSearchParams] = useSearchParams();
  const q = searchParams.get('q') ?? '';
  const de = searchParams.get('de') ?? '';
  const ate = searchParams.get('ate') ?? '';
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [visiveis, setVisiveis] = useState(PAGE_SIZE);

  useEffect(() => {
    api<Evento[]>('/public/eventos').then(setEventos).catch(console.error);
  }, []);

  useEffect(() => {
    setVisiveis(PAGE_SIZE);
  }, [q, de, ate]);

  const filtrados = useMemo(() => {
    const term = q.trim().toLowerCase();
    const inicio = de ? new Date(de + 'T00:00:00').getTime() : null;
    const fim = ate ? new Date(ate + 'T23:59:59').getTime() : null;
    return eventos.filter((ev) => {
      const dataMs = new Date(ev.dataEvento).getTime();
      if (inicio !== null && dataMs < inicio) return false;
      if (fim !== null && dataMs > fim) return false;
      if (term && !ev.nomeEvento.toLowerCase().includes(term)) return false;
      return true;
    });
  }, [q, de, ate, eventos]);

  const visiveisLista = filtrados.slice(0, visiveis);
  const hasMore = visiveis < filtrados.length;
  const hasFilter = Boolean(q || de || ate);

  const updateSearch = (patch: { q?: string; de?: string; ate?: string }) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(patch).forEach(([k, v]) => {
      if (v) next.set(k, v);
      else next.delete(k);
    });
    setSearchParams(next, { replace: true });
  };

  return (
    <PublicLayout>
      <section className="relative h-44 sm:h-56 overflow-hidden">
        <SafeImage
          src={portalAssets.velasAltar}
          alt=""
          width={1280}
          height={720}
          loading="eager"
          fetchPriority="high"
          fallbackLabel="Velas no altar"
          className="cover-fill"
          srcSet={buildSrcSet(portalAssets.velasAltar, [640, 960, 1280])}
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/70 to-background" />
        <div className="absolute inset-0 flex items-end">
          <div className="max-w-3xl mx-auto w-full px-4 pb-5">
            <h1 className="font-serif text-3xl sm:text-4xl text-primary">{t('events.title')}</h1>
            <p className="text-foreground/80 text-sm mt-1">Giras e oficinas abertas à comunidade</p>
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
            <label htmlFor="busca" className="block text-sm font-medium mb-1.5">
              Buscar
            </label>
            <input
              id="busca"
              type="search"
              placeholder="Caboclos, ervas, pretos velhos…"
              value={q}
              onChange={(e) => updateSearch({ q: e.target.value })}
              className="portal-input"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="de" className="block text-sm font-medium mb-1.5">
                A partir de
              </label>
              <input
                id="de"
                type="date"
                value={de}
                onChange={(e) => updateSearch({ de: e.target.value })}
                className="portal-input"
              />
            </div>
            <div>
              <label htmlFor="ate" className="block text-sm font-medium mb-1.5">
                Até
              </label>
              <input
                id="ate"
                type="date"
                value={ate}
                onChange={(e) => updateSearch({ ate: e.target.value })}
                className="portal-input"
              />
            </div>
          </div>
          {hasFilter && (
            <div className="flex items-center justify-between gap-3 pt-1">
              <p className="text-xs text-foreground/75" aria-live="polite">
                {filtrados.length} {filtrados.length === 1 ? 'evento encontrado' : 'eventos encontrados'}
              </p>
              <button
                type="button"
                onClick={() => setSearchParams({}, { replace: true })}
                className="min-h-9 text-sm text-primary hover:underline px-2"
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
            <p className="font-serif text-lg text-primary">{t('events.empty')}</p>
            <p className="mt-2 text-sm text-foreground/75">Ajuste os filtros ou volte em breve.</p>
          </div>
        ) : (
          <>
            <p className="text-sm text-foreground/75 mb-4" aria-live="polite">
              Mostrando {visiveisLista.length} de {filtrados.length}
            </p>
            <ul className="space-y-4">
              {visiveisLista.map((ev) => (
                <EventoCard
                  key={ev.id}
                  ev={ev}
                  labelSubs={t('events.subscribers')}
                  labelDetails={t('events.detail.viewDetails')}
                />
              ))}
            </ul>
            {hasMore && (
              <div className="mt-6 flex justify-center">
                <button
                  type="button"
                  onClick={() => setVisiveis((v) => v + PAGE_SIZE)}
                  className="min-h-11 inline-flex items-center justify-center rounded-xl bg-primary text-primary-foreground font-medium px-6 py-3 hover:bg-primary/90 transition-colors shadow"
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
