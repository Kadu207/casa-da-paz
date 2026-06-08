import { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../i18n/I18nContext';
import { formatMoney, labelEnum } from '../i18n/helpers';

interface Transacao {
  id: number;
  tipo: string;
  categoria: string;
  valor: string;
  status: string;
  adimplencia: string;
  vencimento: string | null;
  dataTransacao: string;
  pessoaId: number | null;
  pessoa?: { id: number; nomeCompleto: string };
}

interface Pessoa {
  id: number;
  nomeCompleto: string;
}

const CATEGORIAS_RECEITA = ['MENSALIDADE', 'LIVRARIA', 'DOACAO', 'MANUTENCAO', 'EVENTOS', 'OFICINAS'];
const CATEGORIAS_DESPESA = ['ESTRUTURA_MANUTENCAO', 'INSUMOS_TERREIRO', 'CUSTOS_OPERACIONAIS'];
const ADIMPLENCIAS = ['EM_DIA', 'ATRASADO', 'PAGO'] as const;

export default function FinanceiroPage() {
  const { t, locale, dateLocale } = useI18n();
  const { user } = useAuth();
  const canWrite = user?.setorAcesso === 'DIRETORIA' || user?.setorAcesso === 'FINANCEIRO';
  const [transacoes, setTransacoes] = useState<Transacao[]>([]);
  const [pessoas, setPessoas] = useState<Pessoa[]>([]);
  const [filtroAdimplencia, setFiltroAdimplencia] = useState('');
  const [mostrarForm, setMostrarForm] = useState(false);
  const [erro, setErro] = useState('');
  const [form, setForm] = useState({
    tipo: 'RECEITA' as 'RECEITA' | 'DESPESA',
    categoria: 'MENSALIDADE',
    valor: '',
    pessoaId: '',
    dataTransacao: new Date().toISOString().slice(0, 10),
    vencimento: '',
    observacoes: '',
  });

  const [importMsg, setImportMsg] = useState('');

  const importarExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErro('');
    setImportMsg('');
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${import.meta.env.VITE_API_URL ?? '/api'}/import/excel`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setErro(data.error ?? t('erp.financeiro.importError'));
      if (data.erros) setImportMsg(JSON.stringify(data.erros, null, 2));
      return;
    }
    setImportMsg(t('erp.financeiro.importSuccess', { count: data.linhas_importadas }));
    await carregar();
    e.target.value = '';
  };

  const carregar = useCallback(async () => {
    const q = filtroAdimplencia ? `?adimplencia=${filtroAdimplencia}` : '';
    const data = await api<Transacao[]>(`/financeiro${q}`);
    setTransacoes(data);
  }, [filtroAdimplencia]);

  useEffect(() => {
    carregar().catch(console.error);
    if (canWrite) {
      api<Pessoa[]>('/pessoas').then(setPessoas).catch(console.error);
    }
  }, [carregar, canWrite]);

  const categorias = form.tipo === 'RECEITA' ? CATEGORIAS_RECEITA : CATEGORIAS_DESPESA;

  const salvar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    try {
      await api('/financeiro', {
        method: 'POST',
        body: JSON.stringify({
          tipo: form.tipo,
          categoria: form.categoria,
          valor: Number(form.valor),
          pessoaId: form.pessoaId ? Number(form.pessoaId) : undefined,
          dataTransacao: form.dataTransacao,
          vencimento: form.vencimento || undefined,
          observacoes: form.observacoes || undefined,
        }),
      });
      setMostrarForm(false);
      await carregar();
    } catch (err) {
      setErro(err instanceof Error ? err.message : t('erp.financeiro.saveError'));
    }
  };

  const marcarPago = async (id: number) => {
    await api(`/financeiro/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'CONCLUIDO' }),
    });
    await carregar();
  };

  const syncAlertas = async () => {
    const res = await api<{ criados: number }>('/financeiro/sync-alertas', { method: 'POST' });
    alert(t('erp.financeiro.alertsGenerated', { count: res.criados }));
  };

  const badge = (s: string) => {
    const colors: Record<string, string> = {
      PAGO: 'bg-[var(--color-success)]',
      EM_DIA: 'bg-emerald-600',
      ATRASADO: 'bg-[var(--color-danger)]',
    };
    return (
      <span className={`px-2 py-0.5 rounded text-xs text-black ${colors[s] ?? 'bg-gray-500'}`}>
        {labelEnum(t, 'adimplencia', s)}
      </span>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xl font-serif text-[var(--color-accent)]">{t('erp.financeiro.title')}</h2>
        <div className="flex gap-2 flex-wrap">
          {canWrite && (
            <>
              <button
                onClick={() => setMostrarForm(true)}
                className="px-4 py-2 bg-[var(--color-accent)] text-black rounded text-sm"
              >
                {t('erp.financeiro.newTx')}
              </button>
              <label className="px-4 py-2 bg-white/10 rounded text-sm cursor-pointer">
                {t('erp.financeiro.importExcel')}
                <input type="file" accept=".xlsx" className="hidden" onChange={importarExcel} />
              </label>
              <button onClick={syncAlertas} className="px-4 py-2 bg-white/10 rounded text-sm">
                {t('erp.financeiro.syncAlerts')}
              </button>
            </>
          )}
        </div>
      </div>

      {importMsg && <p className="text-[var(--color-success)] text-sm whitespace-pre-wrap">{importMsg}</p>}
      <select
        value={filtroAdimplencia}
        onChange={(e) => setFiltroAdimplencia(e.target.value)}
        className="px-3 py-2 rounded bg-black/30 border border-white/20 text-sm"
      >
        <option value="">{t('erp.financeiro.allCompliance')}</option>
        {ADIMPLENCIAS.map((a) => (
          <option key={a} value={a}>
            {labelEnum(t, 'adimplencia', a)}
          </option>
        ))}
      </select>

      {mostrarForm && canWrite && (
        <form onSubmit={salvar} className="bg-[var(--color-surface)] p-4 rounded-xl space-y-3 max-w-lg">
          <h3 className="text-[var(--color-accent)] font-medium">{t('erp.financeiro.newTx')}</h3>
          {erro && <p className="text-[var(--color-danger)] text-sm">{erro}</p>}
          <select
            value={form.tipo}
            onChange={(e) =>
              setForm({
                ...form,
                tipo: e.target.value as 'RECEITA' | 'DESPESA',
                categoria: e.target.value === 'RECEITA' ? 'MENSALIDADE' : 'CUSTOS_OPERACIONAIS',
              })
            }
            className="w-full px-3 py-2 rounded bg-black/30 border border-white/20"
          >
            <option value="RECEITA">{t('erp.financeiro.revenue')}</option>
            <option value="DESPESA">{t('erp.financeiro.expense')}</option>
          </select>
          <select
            value={form.categoria}
            onChange={(e) => setForm({ ...form, categoria: e.target.value })}
            className="w-full px-3 py-2 rounded bg-black/30 border border-white/20"
          >
            {categorias.map((c) => (
              <option key={c} value={c}>
                {labelEnum(t, 'categoria', c)}
              </option>
            ))}
          </select>
          {form.categoria === 'MENSALIDADE' && (
            <select
              value={form.pessoaId}
              onChange={(e) => setForm({ ...form, pessoaId: e.target.value })}
              className="w-full px-3 py-2 rounded bg-black/30 border border-white/20"
              required
            >
              <option value="">{t('erp.common.person')}</option>
              {pessoas.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nomeCompleto}
                </option>
              ))}
            </select>
          )}
          <input
            type="number"
            step="0.01"
            min="0.01"
            value={form.valor}
            onChange={(e) => setForm({ ...form, valor: e.target.value })}
            placeholder={t('erp.common.value')}
            className="w-full px-3 py-2 rounded bg-black/30 border border-white/20"
            required
          />
          <input
            type="date"
            value={form.dataTransacao}
            onChange={(e) => setForm({ ...form, dataTransacao: e.target.value })}
            className="w-full px-3 py-2 rounded bg-black/30 border border-white/20"
          />
          <input
            type="date"
            value={form.vencimento}
            onChange={(e) => setForm({ ...form, vencimento: e.target.value })}
            placeholder={t('erp.common.dueDate')}
            className="w-full px-3 py-2 rounded bg-black/30 border border-white/20"
          />
          <div className="flex gap-2">
            <button type="submit" className="px-4 py-2 bg-[var(--color-accent)] text-black rounded text-sm">
              {t('erp.common.save')}
            </button>
            <button
              type="button"
              onClick={() => setMostrarForm(false)}
              className="px-4 py-2 bg-white/10 rounded text-sm"
            >
              {t('erp.common.cancel')}
            </button>
          </div>
        </form>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b border-white/20">
              <th className="p-2">{t('erp.common.person')}</th>
              <th className="p-2">{t('erp.financeiro.colType')}</th>
              <th className="p-2">{t('erp.financeiro.colCategory')}</th>
              <th className="p-2">{t('erp.common.value')}</th>
              <th className="p-2">{t('erp.common.dueDate')}</th>
              <th className="p-2">{t('erp.financeiro.colCompliance')}</th>
              {canWrite && <th className="p-2">{t('erp.common.actions')}</th>}
            </tr>
          </thead>
          <tbody>
            {transacoes.map((tx) => (
              <tr key={tx.id} className="border-b border-white/10">
                <td className="p-2">{tx.pessoa?.nomeCompleto ?? t('erp.common.emptyDash')}</td>
                <td className="p-2">{labelEnum(t, 'tx', tx.tipo)}</td>
                <td className="p-2">{labelEnum(t, 'categoria', tx.categoria)}</td>
                <td className="p-2">{formatMoney(locale, Number(tx.valor))}</td>
                <td className="p-2 text-white/70">
                  {tx.vencimento ? new Date(tx.vencimento).toLocaleDateString(dateLocale) : t('erp.common.emptyDash')}
                </td>
                <td className="p-2">{badge(tx.adimplencia)}</td>
                {canWrite && (
                  <td className="p-2">
                    {tx.status === 'PENDENTE' && (
                      <button
                        onClick={() => marcarPago(tx.id)}
                        className="text-[var(--color-accent)] hover:underline text-xs"
                      >
                        {t('erp.financeiro.markPaid')}
                      </button>
                    )}
                  </td>
                )}
              </tr>
            ))}
            {transacoes.length === 0 && (
              <tr>
                <td colSpan={canWrite ? 7 : 6} className="p-4 text-center text-white/50">
                  {t('erp.financeiro.empty')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
