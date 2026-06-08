import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { PublicLayout } from '../../components/public/PublicLayout';
import { useI18n } from '../../i18n/I18nContext';

const API_BASE = import.meta.env.VITE_API_URL ?? '/api';

type AgStatus = {
  protocolo: string;
  nome: string;
  status: string;
  dataPreferida: string | null;
  createdAt: string;
};

export default function PublicAcompanhar() {
  const { protocolo } = useParams();
  const { t, dateLocale } = useI18n();
  const [data, setData] = useState<AgStatus | null>(null);
  const [err, setErr] = useState('');

  const statusLabel = (status: string) => {
    if (status === 'PENDENTE') return t('track.status.pending');
    if (status === 'CONFIRMADO') return t('track.status.confirmed');
    if (status === 'CANCELADO') return t('track.status.cancelled');
    return status;
  };

  useEffect(() => {
    if (!protocolo) return;
    fetch(`${API_BASE}/public/acompanhar/${encodeURIComponent(protocolo)}`)
      .then(async (r) => {
        if (!r.ok) throw new Error('not found');
        return r.json() as Promise<AgStatus>;
      })
      .then(setData)
      .catch(() => setErr(t('track.notFound')));
  }, [protocolo, t]);

  return (
    <PublicLayout>
      <section className="max-w-lg mx-auto px-4 py-10">
        {err && (
          <div className="rounded-2xl bg-card border border-border/60 p-6 text-center">
            <p className="text-destructive">{err}</p>
            <Link to="/public/agendar" className="text-primary text-sm mt-4 inline-block">
              {t('track.newBooking')}
            </Link>
          </div>
        )}
        {data && (
          <div className="rounded-2xl bg-card border border-border/60 p-6 space-y-4">
            <h1 className="font-serif text-2xl text-primary">{t('track.title', { protocol: data.protocolo })}</h1>
            <p>
              <span className="text-foreground/70">{t('track.label.name')}:</span> {data.nome}
            </p>
            <p>
              <span className="text-foreground/70">{t('track.label.status')}:</span> {statusLabel(data.status)}
            </p>
            {data.dataPreferida && (
              <p>
                <span className="text-foreground/70">{t('track.label.preferredDate')}:</span>{' '}
                {new Date(data.dataPreferida).toLocaleDateString(dateLocale)}
              </p>
            )}
          </div>
        )}
      </section>
    </PublicLayout>
  );
}
