import { useCallback, useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { useI18n } from '../../i18n/I18nContext';

interface Plano {
  id: number;
  valor: string;
  diaVencimento: number;
  ativo: boolean;
  pessoa: { id: number; nomeCompleto: string };
}

interface Pessoa {
  id: number;
  nomeCompleto: string;
  tipoPerfil: string;
}

export default function FinanceiroRecorrenciaPage() {
  const { t } = useI18n();
  const [planos, setPlanos] = useState<Plano[]>([]);
  const [pessoas, setPessoas] = useState<Pessoa[]>([]);
  const [form, setForm] = useState({ pessoaId: '', valor: '150', diaVencimento: '10' });
  const [msg, setMsg] = useState('');

  const load = useCallback(async () => {
    const [p, pe] = await Promise.all([
      api<Plano[]>('/mensalidade-planos'),
      api<Pessoa[]>('/pessoas?limit=200'),
    ]);
    setPlanos(p);
    setPessoas(Array.isArray(pe) ? pe : (pe as { data?: Pessoa[] }).data ?? []);
  }, []);

  useEffect(() => {
    load().catch(console.error);
  }, [load]);

  const salvar = async (e: React.FormEvent) => {
    e.preventDefault();
    await api('/mensalidade-planos', {
      method: 'POST',
      body: JSON.stringify({
        pessoaId: Number(form.pessoaId),
        valor: Number(form.valor),
        diaVencimento: Number(form.diaVencimento),
        ativo: true,
      }),
    });
    await load();
  };

  const gerar = async () => {
    const res = await api<{ criados: number }>('/mensalidade-planos/gerar', { method: 'POST' });
    setMsg(t('erp.financeiro.rec.generated', { count: String(res.criados) }));
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-white/70">{t('erp.financeiro.rec.hint')}</p>
      <form onSubmit={salvar} className="flex flex-wrap gap-2 items-end">
        <select
          required
          value={form.pessoaId}
          onChange={(e) => setForm({ ...form, pessoaId: e.target.value })}
          className="px-3 py-2 rounded bg-white/5 border border-white/10"
        >
          <option value="">{t('erp.financeiro.rec.person')}</option>
          {pessoas.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nomeCompleto}
            </option>
          ))}
        </select>
        <input
          type="number"
          step="0.01"
          value={form.valor}
          onChange={(e) => setForm({ ...form, valor: e.target.value })}
          className="w-28 px-3 py-2 rounded bg-white/5 border border-white/10"
        />
        <input
          type="number"
          min={1}
          max={28}
          value={form.diaVencimento}
          onChange={(e) => setForm({ ...form, diaVencimento: e.target.value })}
          className="w-20 px-3 py-2 rounded bg-white/5 border border-white/10"
        />
        <button type="submit" className="px-3 py-2 rounded bg-[var(--color-accent)] text-black text-sm">
          {t('erp.financeiro.rec.save')}
        </button>
        <button type="button" onClick={gerar} className="px-3 py-2 rounded bg-white/10 text-sm">
          {t('erp.financeiro.rec.run')}
        </button>
      </form>
      {msg && <p className="text-sm text-[var(--color-accent)]">{msg}</p>}
      <ul className="text-sm space-y-1">
        {planos.map((p) => (
          <li key={p.id} className="border-b border-white/5 py-2">
            {p.pessoa.nomeCompleto} —{' '}
            {Number(p.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} dia{' '}
            {p.diaVencimento} {p.ativo ? '' : '(inativo)'}
          </li>
        ))}
      </ul>
    </div>
  );
}
