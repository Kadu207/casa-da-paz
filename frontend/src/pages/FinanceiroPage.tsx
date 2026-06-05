import { useEffect, useState } from 'react';
import { api } from '../lib/api';

interface Transacao {
  id: number;
  categoria: string;
  valor: string;
  status: string;
  adimplencia: string;
  pessoa?: { nomeCompleto: string };
}

export default function FinanceiroPage() {
  const [transacoes, setTransacoes] = useState<Transacao[]>([]);

  useEffect(() => {
    api<Transacao[]>('/financeiro').then(setTransacoes).catch(console.error);
  }, []);

  const badge = (s: string) => {
    const colors: Record<string, string> = {
      PAGO: 'bg-[var(--color-success)]',
      EM_DIA: 'bg-[var(--color-success)]',
      ATRASADO: 'bg-[var(--color-danger)]',
      PENDENTE: 'bg-amber-500',
    };
    return (
      <span className={`px-2 py-0.5 rounded text-xs text-black ${colors[s] ?? 'bg-gray-500'}`}>{s}</span>
    );
  };

  return (
    <div>
      <h2 className="text-xl font-serif text-[var(--color-accent)] mb-4">Financeiro</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b border-white/20">
              <th className="p-2">Pessoa</th>
              <th className="p-2">Categoria</th>
              <th className="p-2">Valor</th>
              <th className="p-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {transacoes.map((t) => (
              <tr key={t.id} className="border-b border-white/10">
                <td className="p-2">{t.pessoa?.nomeCompleto ?? '—'}</td>
                <td className="p-2">{t.categoria}</td>
                <td className="p-2">R$ {Number(t.valor).toFixed(2)}</td>
                <td className="p-2">{badge(t.adimplencia ?? t.status)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
