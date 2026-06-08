import { useRef, useState } from 'react';
import { PublicLayout } from '../../components/public/PublicLayout';
import { SafeImage } from '../../components/public/SafeImage';
import { TurnstileWidget, turnstileConfigured } from '../../components/public/TurnstileWidget';
import { LgpdConsentCheckbox } from '../../components/public/LgpdConsentCheckbox';
import { WHATSAPP_NUMBER, portalAssets } from '../../lib/portal-assets';
import { Link } from 'react-router-dom';
import { useI18n } from '../../i18n/I18nContext';

const API_BASE = import.meta.env.VITE_API_URL ?? '/api';
const MIN_FORM_FILL_MS = 3000;

type Summary = {
  protocolo: string;
  nome: string;
  telefone: string;
  dataPreferida: string;
  observacao?: string;
};

export default function PublicAgendar() {
  const { t, dateLocale } = useI18n();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState('');
  const [aceiteLgpd, setAceiteLgpd] = useState(false);
  const mountedAt = useRef(Date.now());

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitError('');
    setSubmitting(true);

    const fd = new FormData(e.currentTarget);
    const nome = String(fd.get('nome') ?? '').trim();
    const telefone = String(fd.get('telefone') ?? '').trim();
    const dataPreferida = String(fd.get('dataPreferida') ?? '');
    const observacao = String(fd.get('observacao') ?? '').trim();
    const website = String(fd.get('website') ?? '');

    if (website) {
      setSubmitting(false);
      return;
    }
    if (Date.now() - mountedAt.current < MIN_FORM_FILL_MS) {
      setSubmitError(t('schedule.error.wait'));
      setSubmitting(false);
      return;
    }

    if (turnstileConfigured() && !turnstileToken) {
      setSubmitError(t('schedule.error.turnstile'));
      setSubmitting(false);
      return;
    }
    if (!aceiteLgpd) {
      setSubmitError(t('lgpd.consentRequired'));
      setSubmitting(false);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/public/agendamentos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome,
          telefone,
          dataPreferida,
          observacao: observacao || undefined,
          turnstileToken: turnstileToken || undefined,
          aceiteLgpd: true,
        }),
      });
      const payload = (await res.json().catch(() => ({}))) as {
        protocolo?: string;
        id?: number;
        error?: string | { formErrors?: string[] };
      };

      if (res.status === 429) {
        setSubmitError(t('schedule.error.rateLimit'));
        return;
      }
      if (!res.ok) {
        const msg = typeof payload.error === 'string' ? payload.error : t('schedule.error.generic');
        setSubmitError(msg);
        return;
      }

      const protocolo =
        payload.protocolo ?? (payload.id ? `CDP-${payload.id.toString().padStart(6, '0')}` : 'CDP-PENDENTE');

      setSummary({ protocolo, nome, telefone, dataPreferida, observacao: observacao || undefined });
      mountedAt.current = Date.now();
      e.currentTarget.reset();
    } catch {
      setSubmitError(t('schedule.error.generic'));
    } finally {
      setSubmitting(false);
    }
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <PublicLayout>
      <section className="relative h-36 sm:h-44 overflow-hidden">
        <SafeImage
          src={portalAssets.bannerNature}
          alt=""
          width={1536}
          height={768}
          fallbackLabel={t('schedule.title')}
          className="cover-fill"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/60 to-background" />
        <div className="absolute inset-0 flex items-end">
          <div className="max-w-3xl mx-auto w-full px-4 pb-5">
            <h1 className="font-serif text-3xl sm:text-4xl text-primary">{t('schedule.title')}</h1>
            <p className="text-foreground/70 text-sm mt-1">{t('schedule.subtitle')}</p>
          </div>
        </div>
      </section>

      <section className="max-w-xl mx-auto px-4 py-8">
        {summary ? (
          <div
            role="status"
            aria-live="polite"
            className="rounded-2xl border border-success/40 bg-card p-6 sm:p-8"
          >
            <div className="text-center">
              <div className="mx-auto h-12 w-12 rounded-full bg-success/20 flex items-center justify-center text-success text-2xl">
                ✓
              </div>
              <h2 className="font-serif text-2xl text-primary mt-4">{t('schedule.success')}</h2>
              <p className="text-foreground/80 mt-2">
                {t('schedule.success.greeting', { name: summary.nome.split(' ')[0] })}
              </p>
              <p className="mt-2 text-sm text-foreground/75">{t('schedule.protocolLabel')}</p>
              <p className="mt-1 font-mono text-lg text-primary tracking-wider">{summary.protocolo}</p>
              <Link
                to={`/public/acompanhar/${summary.protocolo}`}
                className="text-sm text-primary hover:underline mt-2 inline-block"
              >
                {t('schedule.trackStatus')}
              </Link>
            </div>
            <dl className="mt-6 rounded-xl border border-border/60 bg-background/40 p-4 text-sm space-y-2">
              <div className="flex justify-between gap-3">
                <dt className="text-foreground/70">{t('schedule.label.name')}</dt>
                <dd className="text-right">{summary.nome}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-foreground/70">{t('schedule.label.phone')}</dt>
                <dd className="text-right">{summary.telefone}</dd>
              </div>
              {summary.dataPreferida && (
                <div className="flex justify-between gap-3">
                  <dt className="text-foreground/70">{t('schedule.label.preferredDate')}</dt>
                  <dd className="text-right">
                    {new Date(summary.dataPreferida + 'T00:00:00').toLocaleDateString(dateLocale, {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </dd>
                </div>
              )}
            </dl>
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <a
                href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
                  t('schedule.whatsappMessage', { protocol: summary.protocolo }),
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 min-h-11 inline-flex items-center justify-center rounded-xl bg-primary text-primary-foreground font-medium px-5 py-2.5 hover:bg-primary/90 transition-colors"
              >
                {t('schedule.whatsapp')}
              </a>
              <button
                type="button"
                onClick={() => setSummary(null)}
                className="flex-1 min-h-11 inline-flex items-center justify-center rounded-xl border border-primary text-primary font-medium px-5 py-2.5 hover:bg-primary/10 transition-colors"
              >
                {t('schedule.another')}
              </button>
            </div>
          </div>
        ) : (
          <form
            onSubmit={submit}
            className="rounded-2xl bg-card border border-border/60 p-6 sm:p-8 shadow-lg space-y-5"
            noValidate
          >
            <div aria-hidden="true" className="hidden">
              <input name="website" type="text" tabIndex={-1} autoComplete="off" />
            </div>
            {submitError && (
              <div role="alert" className="rounded-xl border border-destructive/50 bg-destructive/10 p-4 text-sm">
                {submitError}
              </div>
            )}
            <Field id="nome" label={t('schedule.field.name')} required>
              <input
                id="nome"
                name="nome"
                required
                autoComplete="name"
                className="portal-input"
                placeholder={t('schedule.placeholder.name')}
              />
            </Field>
            <Field id="telefone" label={t('schedule.field.phone')} required>
              <input
                id="telefone"
                name="telefone"
                type="tel"
                required
                autoComplete="tel"
                className="portal-input"
                placeholder={t('schedule.placeholder.phone')}
              />
            </Field>
            <Field id="dataPreferida" label={t('schedule.field.date')}>
              <input id="dataPreferida" name="dataPreferida" type="date" min={today} className="portal-input" />
            </Field>
            <Field id="observacao" label={t('schedule.field.notes')}>
              <textarea
                id="observacao"
                name="observacao"
                rows={4}
                maxLength={500}
                className="portal-input resize-none"
                placeholder={t('schedule.placeholder.notes')}
              />
            </Field>
            <TurnstileWidget onToken={setTurnstileToken} onExpire={() => setTurnstileToken('')} />
            <LgpdConsentCheckbox checked={aceiteLgpd} onChange={setAceiteLgpd} id="agendar-lgpd" />
            <button
              type="submit"
              disabled={submitting}
              className="w-full min-h-12 inline-flex items-center justify-center rounded-xl bg-primary text-primary-foreground font-medium px-6 py-3 hover:bg-primary/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed shadow"
            >
              {submitting ? t('schedule.submitting') : t('schedule.submit')}
            </button>
            <p className="text-xs text-foreground/70 text-center">
              {t('schedule.requiredNote')}{' '}
              <Link to="/public/termos" className="text-primary hover:underline">
                {t('terms.link')}
              </Link>
              .
            </p>
          </form>
        )}
      </section>
    </PublicLayout>
  );
}

function Field({
  id,
  label,
  required,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium mb-1.5">
        {label}
        {required && (
          <span aria-hidden="true" className="text-destructive ml-0.5">
            *
          </span>
        )}
      </label>
      {children}
    </div>
  );
}
