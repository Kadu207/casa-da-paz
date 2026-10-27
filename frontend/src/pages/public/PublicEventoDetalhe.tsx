import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { PublicLayout } from '../../components/public/PublicLayout';
import { TurnstileWidget, turnstileConfigured } from '../../components/public/TurnstileWidget';
import { LgpdConsentCheckbox } from '../../components/public/LgpdConsentCheckbox';
import { api } from '../../lib/api';
import { useI18n } from '../../i18n/I18nContext';
import { downloadIcs, eventoStartEnd, generateIcsEvent } from '../../lib/ics';

interface LotePublico {
  id: number;
  nome: string;
  valor: string | number;
  quantidade: number;
  vagasRestantes: number;
}

interface EventoDetalhe {
  id: number;
  nomeEvento: string;
  dataEvento: string;
  capacidadeMax: number | null;
  visualizacoes: number;
  local: string;
  resumo: string;
  _count: { inscricoes: number };
  lotes?: LotePublico[];
}

interface ReservaOk {
  codigo: string;
  valor: string | number;
  lote: string;
  eventoNome: string;
}

const API_BASE = import.meta.env.VITE_API_URL ?? '/api';

function formatBrl(value: number, locale: string): string {
  return new Intl.NumberFormat(locale === 'en' ? 'en-US' : 'pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export default function PublicEventoDetalhe() {
  const { id } = useParams<{ id: string }>();
  const { t, dateLocale, locale } = useI18n();
  const [evento, setEvento] = useState<EventoDetalhe | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [loteId, setLoteId] = useState<number | null>(null);
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [email, setEmail] = useState('');
  const [aceiteLgpd, setAceiteLgpd] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState('');
  const [turnstileRequired, setTurnstileRequired] = useState(turnstileConfigured());
  const [submitting, setSubmitting] = useState(false);
  const [reservaErro, setReservaErro] = useState('');
  const [reservaOk, setReservaOk] = useState<ReservaOk | null>(null);

  const recomendacoes = useMemo(
    () => [t('events.recommendations.1'), t('events.recommendations.2'), t('events.recommendations.3')],
    [t]
  );

  useEffect(() => {
    if (!id) return;
    api<EventoDetalhe>(`/public/eventos/${id}`)
      .then((ev) => {
        setEvento(ev);
        const primeiro = (ev.lotes ?? []).find((l) => l.vagasRestantes > 0);
        setLoteId(primeiro?.id ?? ev.lotes?.[0]?.id ?? null);
      })
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
      description: `${evento.resumo}\n\n${recomendacoes.join('\n')}`,
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

  const reservar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!evento || !loteId || submitting) return;
    setReservaErro('');
    if (!aceiteLgpd) {
      setReservaErro(t('lgpd.consentRequired'));
      return;
    }
    if (turnstileRequired && !turnstileToken) {
      setReservaErro(t('schedule.error.turnstile'));
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/public/eventos/${evento.id}/reservas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ingressoLoteId: loteId,
          nome: nome.trim(),
          telefone: telefone.trim(),
          email: email.trim() || undefined,
          turnstileToken: turnstileToken || undefined,
          aceiteLgpd: true,
        }),
      });
      const payload = (await res.json().catch(() => ({}))) as ReservaOk & {
        error?: string;
        code?: string;
      };
      if (!res.ok) {
        if (payload.code === 'TELEFONE_AMBIGUO') {
          setReservaErro(t('events.reserve.ambiguous'));
        } else {
          setReservaErro(typeof payload.error === 'string' ? payload.error : t('events.reserve.error'));
        }
        return;
      }
      setReservaOk({
        codigo: payload.codigo,
        valor: payload.valor,
        lote: payload.lote,
        eventoNome: payload.eventoNome,
      });
      const refreshed = await api<EventoDetalhe>(`/public/eventos/${evento.id}`);
      setEvento(refreshed);
    } catch {
      setReservaErro(t('events.reserve.error'));
    } finally {
      setSubmitting(false);
    }
  };

  const dataFmt = evento
    ? new Date(evento.dataEvento).toLocaleDateString(dateLocale, {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
    : '';

  const lotes = evento?.lotes ?? [];
  const temLotes = lotes.length > 0;

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
                  {recomendacoes.map((r) => (
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

            <div className="rounded-2xl bg-card border border-border/60 p-5 sm:p-6 shadow-sm space-y-4">
              <h2 className="font-serif text-xl text-primary">{t('events.reserve.title')}</h2>

              {!temLotes && (
                <p className="text-sm text-foreground/75">{t('events.reserve.noLotes')}</p>
              )}

              {reservaOk && (
                <div className="rounded-xl border border-primary/40 bg-primary/5 p-4 space-y-2">
                  <p className="font-medium text-primary">{t('events.reserve.success')}</p>
                  <p className="text-sm">{t('events.reserve.codeLabel')}</p>
                  <p className="font-mono text-2xl tracking-widest text-primary">{reservaOk.codigo}</p>
                  <p className="text-sm text-foreground/80">{t('events.reserve.keepCode')}</p>
                  <p className="text-sm">
                    {reservaOk.lote} — {formatBrl(Number(reservaOk.valor), locale)}
                  </p>
                </div>
              )}

              {temLotes && !reservaOk && (
                <form onSubmit={reservar} className="space-y-4">
                  <fieldset className="space-y-2">
                    <legend className="text-sm font-medium">{t('events.reserve.lote')}</legend>
                    {lotes.map((lote) => {
                      const esgotado = lote.vagasRestantes <= 0;
                      return (
                        <label
                          key={lote.id}
                          className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-3 ${
                            esgotado
                              ? 'opacity-50 border-border/40'
                              : loteId === lote.id
                                ? 'border-primary bg-primary/5'
                                : 'border-border/60'
                          }`}
                        >
                          <span className="flex items-center gap-3">
                            <input
                              type="radio"
                              name="lote"
                              disabled={esgotado}
                              checked={loteId === lote.id}
                              onChange={() => setLoteId(lote.id)}
                            />
                            <span>
                              <span className="font-medium block">{lote.nome}</span>
                              <span className="text-xs text-foreground/70">
                                {esgotado
                                  ? t('events.reserve.soldOut')
                                  : t('events.reserve.spots', { count: lote.vagasRestantes })}
                              </span>
                            </span>
                          </span>
                          <span className="font-medium">
                            {formatBrl(Number(lote.valor), locale)}
                          </span>
                        </label>
                      );
                    })}
                  </fieldset>

                  <input
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder={t('events.reserve.name')}
                    className="w-full min-h-11 rounded-xl border border-border px-4 py-2 bg-background"
                    required
                    minLength={2}
                  />
                  <input
                    value={telefone}
                    onChange={(e) => setTelefone(e.target.value)}
                    placeholder={t('events.reserve.phone')}
                    className="w-full min-h-11 rounded-xl border border-border px-4 py-2 bg-background"
                    required
                    minLength={8}
                  />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t('events.reserve.email')}
                    className="w-full min-h-11 rounded-xl border border-border px-4 py-2 bg-background"
                  />
                  <input type="text" name="website" className="hidden" tabIndex={-1} autoComplete="off" />

                  <TurnstileWidget
                    onRequiredChange={setTurnstileRequired}
                    onToken={(token) => setTurnstileToken(token)}
                    onExpire={() => setTurnstileToken('')}
                  />
                  <LgpdConsentCheckbox
                    checked={aceiteLgpd}
                    onChange={setAceiteLgpd}
                    id="reserva-evento-lgpd"
                  />

                  {reservaErro && <p className="text-sm text-destructive">{reservaErro}</p>}

                  <button
                    type="submit"
                    disabled={submitting || !loteId}
                    className="min-h-11 w-full sm:w-auto inline-flex items-center justify-center rounded-xl bg-primary text-primary-foreground font-medium px-6 py-2.5 hover:bg-primary/90 disabled:opacity-60"
                  >
                    {submitting ? t('schedule.submitting') : t('events.reserve.submit')}
                  </button>
                </form>
              )}
            </div>
          </article>
        )}
      </section>
    </PublicLayout>
  );
}
