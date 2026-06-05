import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { PublicLayout } from '../../components/public/PublicLayout';
import { api } from '../../lib/api';
import { useI18n } from '../../i18n/I18nContext';
import { downloadIcs, eventoStartEnd, generateIcsEvent } from '../../lib/ics';

interface EventoDetalhe {
  id: number;
  nomeEvento: string;
  dataEvento: string;
  capacidadeMax: number | null;
  visualizacoes: number;
  local: string;
  resumo: string;
  _count: { inscricoes: number };
}

const RECOMENDACOES = [
  'Vista roupas claras ou brancas, com respeito ao ambiente sagrado.',
  'Evite perfumes fortes e álcool antes da gira.',
  'Chegue com alguns minutos de antecedência para acolhimento.',
];

export default function PublicEventoDetalhe() {
  const { id } = useParams<{ id: string }>();
  const { t, locale } = useI18n();
  const [evento, setEvento] = useState<EventoDetalhe | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    api<EventoDetalhe>(`/public/eventos/${id}`)
      .then(setEvento)
      .catch(() => setErro(t('events.detail.notFound')));
  }, [id, t]);

  const handleCalendar = () => {
    if (!evento) return;
    const { start, end } = eventoStartEnd(evento.dataEvento);
    const ics = generateIcsEvent({
      uid: `evento-${evento.id}@casadapaz.inovatitech.com.br`,
      title: evento.nomeEvento,
      start,
      end,
      location: evento.local,
      description: `${evento.resumo}\n\n${RECOMENDACOES.join('\n')}`,
    });
    downloadIcs(`casa-da-paz-${evento.id}.ics`, ics);
  };

  const handleShare = async () => {
    if (!evento || !navigator.share) return;
    try {
      await navigator.share({
        title: evento.nomeEvento,
        text: evento.resumo,
        url: window.location.href,
      });
    } catch {
      /* cancelado */
    }
  };

  const dataFmt = evento
    ? new Date(evento.dataEvento).toLocaleDateString(locale === 'en' ? 'en-US' : 'pt-BR', {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
    : '';

  return (
    <PublicLayout>
      <section className="max-w-3xl mx-auto px-4 py-8">
        <Link to="/public/eventos" className="text-sm text-primary hover:underline">
          ← {t('events.detail.back')}
        </Link>

        {erro && (
          <div className="mt-6 rounded-2xl bg-card border border-border/60 p-8 text-center">
            <p className="font-serif text-lg text-primary">{erro}</p>
          </div>
        )}

        {evento && (
          <article className="mt-6 space-y-6">
            <header>
              <h1 className="font-serif text-3xl sm:text-4xl text-primary">{evento.nomeEvento}</h1>
              <p className="mt-2 text-foreground/85 capitalize">{dataFmt}</p>
              <p className="mt-1 text-sm text-foreground/70">{evento.local}</p>
            </header>

            <div className="rounded-2xl bg-card border border-border/60 p-5 sm:p-6 shadow-sm space-y-4">
              <p className="text-foreground/90 leading-relaxed">{evento.resumo}</p>

              {evento.capacidadeMax != null && (
                <p className="text-sm text-foreground/75">
                  {evento._count.inscricoes}/{evento.capacidadeMax} {t('events.subscribers')}
                </p>
              )}

              <div>
                <h2 className="font-serif text-lg text-primary mb-2">{t('events.detail.recommendations')}</h2>
                <ul className="list-disc pl-5 space-y-1 text-sm text-foreground/85">
                  {RECOMENDACOES.map((r) => (
                    <li key={r}>{r}</li>
                  ))}
                </ul>
              </div>

              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCalendar}
                  className="min-h-11 inline-flex items-center justify-center rounded-xl bg-primary text-primary-foreground font-medium px-5 py-2.5 hover:bg-primary/90 transition-colors shadow"
                >
                  {t('events.detail.addCalendar')}
                </button>
                {typeof navigator !== 'undefined' && 'share' in navigator && (
                  <button
                    type="button"
                    onClick={handleShare}
                    className="min-h-11 inline-flex items-center justify-center rounded-xl border border-border px-5 py-2.5 hover:bg-muted/50 transition-colors"
                  >
                    {t('events.detail.share')}
                  </button>
                )}
                <Link
                  to="/public/agendar"
                  className="min-h-11 inline-flex items-center justify-center rounded-xl border border-primary text-primary font-medium px-5 py-2.5 hover:bg-primary/10 transition-colors"
                >
                  {t('nav.schedule')}
                </Link>
              </div>
            </div>
          </article>
        )}
      </section>
    </PublicLayout>
  );
}
