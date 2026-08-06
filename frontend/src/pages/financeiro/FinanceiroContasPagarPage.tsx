import { useCallback, useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { useI18n } from '../../i18n/I18nContext';

interface Fornecedor {
  id: number;
  nome: string;
  ativo: boolean;
}

interface Conta {
  id: number;
  descricao: string;
  categoria: string;
  valorTotal: string;
  vencimento: string;
  status: string;
  fornecedor: Fornecedor | null;
  parcelas: { id: number; numero: number; valor: string; status: string }[];
}

export default function FinanceiroContasPagarPage() {
  const { t } = useI18n();
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [contas, setContas] = useState<Conta[]>([]);
  const [form, setForm] = useState({
    descricao: '',
    categoria: 'CUSTOS_OPERACIONAIS',
    valorTotal: '',
    vencimento: '',
    fornecedorId: '',
  });
  const [novoForn, setNovoForn] = useState('');

  const load = useCallback(async () => {
    const [f, c] = await Promise.all([
      api<Fornecedor[]>('/fornecedores'),
      api<Conta[]>('/contas-pagar'),
    ]);
    setFornecedores(f);
    setContas(c);
  }, []);

  useEffect(() => {
    load().catch(console.error);
  }, [load]);

  const criarFornecedor = async (e: React.FormEvent) => {
    e.preventDefault();
    await api('/fornecedores', { method: 'POST', body: JSON.stringify({ nome: novoForn }) });
    setNovoForn('');
    await load();
  };

  const criarConta = async (e: React.FormEvent) => {
    e.preventDefault();
    await api('/contas-pagar', {
      method: 'POST',
      body: JSON.stringify({
        descricao: form.descricao,
        categoria: form.categoria,
        valorTotal: Number(form.valorTotal),
        vencimento: form.vencimento,
        fornecedorId: form.fornecedorId ? Number(form.fornecedorId) : undefined,
      }),
    });
    setForm({
      descricao: '',
      categoria: 'CUSTOS_OPERACIONAIS',
      valorTotal: '',
      vencimento: '',
      fornecedorId: '',
    });
    await load();
  };

  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <h3 className="text-sm font-medium text-white/80">{t('erp.financeiro.ap.suppliers')}</h3>
        <form onSubmit={criarFornecedor} className="flex gap-2 flex-wrap">
          <input
            value={novoForn}
            onChange={(e) => setNovoForn(e.target.value)}
            required
            placeholder={t('erp.financeiro.ap.supplierName')}
            className="px-3 py-2 rounded bg-white/5 border border-white/10 flex-1 min-w-[12rem]"
          />
          <button type="submit" className="px-3 py-2 rounded bg-white/10 text-sm">
            {t('erp.financeiro.ap.addSupplier')}
          </button>
        </form>
      </section>

      <section className="space-y-2">
        <h3 className="text-sm font-medium text-white/80">{t('erp.financeiro.ap.new')}</h3>
        <form onSubmit={criarConta} className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <input
            value={form.descricao}
            onChange={(e) => setForm({ ...form, descricao: e.target.value })}
            required
            placeholder={t('erp.financeiro.pagamentos.desc')}
            className="px-3 py-2 rounded bg-white/5 border border-white/10"
          />
          <select
            value={form.fornecedorId}
            onChange={(e) => setForm({ ...form, fornecedorId: e.target.value })}
            className="px-3 py-2 rounded bg-white/5 border border-white/10"
          >
            <option value="">{t('erp.financeiro.ap.noSupplier')}</option>
            {fornecedores
              .filter((f) => f.ativo)
              .map((f) => (
                <option key={f.id} value={f.id}>
                  {f.nome}
                </option>
              ))}
          </select>
          <input
            type="number"
            step="0.01"
            value={form.valorTotal}
            onChange={(e) => setForm({ ...form, valorTotal: e.target.value })}
            required
            className="px-3 py-2 rounded bg-white/5 border border-white/10"
          />
          <input
            type="date"
            value={form.vencimento}
            onChange={(e) => setForm({ ...form, vencimento: e.target.value })}
            required
            className="px-3 py-2 rounded bg-white/5 border border-white/10"
          />
          <button
            type="submit"
            className="sm:col-span-2 px-4 py-2 rounded bg-[var(--color-accent)] text-black text-sm font-medium"
          >
            {t('erp.financeiro.ap.create')}
          </button>
        </form>
      </section>

      <ul className="space-y-2 text-sm">
        {contas.map((c) => (
          <li key={c.id} className="border-b border-white/5 py-2 flex justify-between gap-2">
            <span>
              {c.descricao}{' '}
              <span className="text-white/40">
                ({c.status} · {c.fornecedor?.nome ?? '—'})
              </span>
            </span>
            <span>
              {Number(c.valorTotal).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
