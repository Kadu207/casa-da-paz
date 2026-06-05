import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { PublicLayout } from '../../components/public/PublicLayout';

const API_BASE = import.meta.env.VITE_API_URL ?? '/api';

type AgStatus = {
  protocolo: string;
  nome: string;
  status: string;
  dataPreferida: string | null;
  createdAt: string;
};

const STATUS_LABEL: Record<string, { 'pt-BR': string; en: string }> = {
  PENDENTE: { 'pt-BR': 'Aguardando recepção', en: 'Awaiting reception' },
  CONFIRMADO: { 'pt-BR': 'Confirmado', en: 'Confirmed' },
  CANCELADO: { 'pt-BR': 'Cancelado', en: 'Cancelled' },
};

export default function PublicAcompanhar() {
  const { protocolo } = useParams();
  const [data, setData] = useState<AgStatus | null>(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    if (!protocolo) return;
    fetch(`${API_BASE}/public/acompanhar/${encodeURIComponent(protocolo)}`)
      .then(async (r) => {
        if (!r.ok) throw new Error('not found');
        return r.json() as Promise<AgStatus>;
      })
      .then(setData)
      .catch(() => setErr('Protocolo não encontrado.'));
  }, [protocolo]);

  return (
    <PublicLayout>
      <section className="max-w-lg mx-auto px-4 py-10">
        {err && (
          <div className="rounded-2xl bg-card border border-border/60 p-6 text-center">
            <p className="text-destructive">{err}</p>
            <Link to="/public/agendar" className="text-primary text-sm mt-4 inline-block">
              Novo agendamento
            </Link>
          </div>
        )}
        {data && (
          <div className="rounded-2xl bg-card border border-border/60 p-6 space-y-4">
            <h1 className="font-serif text-2xl text-primary">Protocolo {data.protocolo}</h1>
            <p>
              <span className="text-foreground/70">Nome:</span> {data.nome}
            </p>
            <p>
              <span className="text-foreground/70">Status:</span>{' '}
              {STATUS_LABEL[data.status]?.['pt-BR'] ?? data.status}
            </p>
            {data.dataPreferida && (
              <p>
                <span className="text-foreground/70">Data preferida:</span>{' '}
                {new Date(data.dataPreferida).toLocaleDateString('pt-BR')}
              </p>
            )}
          </div>
        )}
      </section>
    </PublicLayout>
  );
}
