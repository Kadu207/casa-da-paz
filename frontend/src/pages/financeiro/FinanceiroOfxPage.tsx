import { useCallback, useEffect, useState } from 'react';
import { api, getToken } from '../../lib/api';
import { useI18n } from '../../i18n/I18nContext';

interface Conta {
  id: number;
  nome: string;
}

interface Mov {
  id: number;
  fitId: string;
  data: string;
  valor: string;
  tipo: string;
  memo: string | null;
  status: string;
}

export default function FinanceiroOfxPage() {
  const { t } = useI18n();
  const [contas, setContas] = useState<Conta[]>([]);
  const [contaId, setContaId] = useState('');
  const [movs, setMovs] = useState<Mov[]>([]);
  const [msg, setMsg] = useState('');

  const load = useCallback(async () => {
    const [c, m] = await Promise.all([
      api<Conta[]>('/financeiro/contas'),
      api<Mov[]>('/financeiro/ofx/movimentos'),
    ]);
    setContas(c);
    setMovs(m);
    if (!contaId && c[0]) setContaId(String(c[0].id));
  }, [contaId]);

  useEffect(() => {
    load().catch(console.error);
  }, [load]);

  const upload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !contaId) return;
    const fd = new FormData();
    fd.append('file', file);
    fd.append('contaId', contaId);
    const base = import.meta.env.VITE_API_URL ?? '/api';
    const res = await fetch(`${base}/financeiro/ofx/import`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${getToken()}` },
      body: fd,
    });
    const json = await res.json();
    if (!res.ok) {
      setMsg(json.error ?? 'Erro upload');
      return;
    }
    setMsg(t('erp.financeiro.ofx.imported', { count: String(json.imported) }));
    await load();
  };

  const conciliar = async (id: number) => {
    await api(`/financeiro/ofx/movimentos/${id}/conciliar`, { method: 'POST', body: '{}' });
    await load();
  };

  const ignorar = async (id: number) => {
    await api(`/financeiro/ofx/movimentos/${id}/ignorar`, { method: 'POST', body: '{}' });
    await load();
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-white/70">{t('erp.financeiro.ofx.hint')}</p>
      <div className="flex flex-wrap gap-2 items-center">
        <select
          value={contaId}
          onChange={(e) => setContaId(e.target.value)}
          className="px-3 py-2 rounded bg-white/5 border border-white/10"
        >
          {contas.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nome}
            </option>
          ))}
        </select>
        <label className="px-3 py-2 rounded bg-[var(--color-accent)] text-black text-sm cursor-pointer">
          {t('erp.financeiro.ofx.upload')}
          <input type="file" accept=".ofx,.OFX" className="hidden" onChange={upload} />
        </label>
      </div>
      {msg && <p className="text-sm text-[var(--color-accent)]">{msg}</p>}
      <ul className="text-sm space-y-1">
        {movs.map((m) => (
          <li key={m.id} className="flex flex-wrap justify-between gap-2 border-b border-white/5 py-2">
            <span>
              {new Date(m.data).toLocaleDateString('pt-BR')} {m.tipo}{' '}
              {Number(m.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} —{' '}
              {m.memo ?? m.fitId} <span className="text-white/40">({m.status})</span>
            </span>
            {m.status === 'PENDENTE' && (
              <span className="flex gap-2">
                <button type="button" className="text-[var(--color-accent)]" onClick={() => conciliar(m.id)}>
                  {t('erp.financeiro.ofx.match')}
                </button>
                <button type="button" className="text-white/50" onClick={() => ignorar(m.id)}>
                  {t('erp.financeiro.ofx.ignore')}
                </button>
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
