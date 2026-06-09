import { useCallback, useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../i18n/I18nContext';
import { formatMoney, labelEnum } from '../../i18n/helpers';
import { AdimplenciaBadge } from '../../components/financeiro/AdimplenciaBadge';
import {
  ADIMPLENCIAS,
  CATEGORIAS_DESPESA,
  CATEGORIAS_RECEITA,
} from '../../lib/financeiro-utils';
import type { PaginatedTransacoes, Transacao } from '../../types/financeiro';

interface Pessoa {
  id: number;
  nomeCompleto: string;
}

const emptyForm = () => ({
  tipo: 'RECEITA' as 'RECEITA' | 'DESPESA',
  categoria: 'MENSALIDADE',
  valor: '',
  pessoaId: '',
  dataTransacao: new Date().toISOString().slice(0, 10),
  vencimento: '',
  observacoes: '',
});

export default function FinanceiroLancamentosPage() {
  const { t, locale, dateLocale } = useI18n();
  const { user } = useAuth();
  const canWrite = user?.setorAcesso === 'DIRETORIA' || user?.setorAcesso === 'FINANCEIRO';

  const [transacoes, setTransacoes] = useState<Transacao[]>([]);
  const [meta, setMeta] = useState({ page: 1, limit: 50, total: 0, totalPages: 1 });
  const [pessoas, setPessoas] = useState<Pessoa[]>([]);
  const [filtros, setFiltros] = useState({
    de: '',
    ate: '',
    tipo: '',
    categoria: '',
    status: '',
    adimplencia: '',
  });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [erro, setErro] = useState('');
  const [importMsg, setImportMsg] = useState('');
  const [form, setForm] = useState(emptyForm);

  const buildQuery = useCallback(() => {
    const p = new URLSearchParams();
    p.set('page', String(page));
    p.set('limit', '50');
    if (filtros.de) p.set('de', filtros.de);
    if (filtros.ate) p.set('ate', filtros.ate);
    if (filtros.tipo) p.set('tipo', filtros.tipo);
    if (filtros.categoria) p.set('categoria', filtros.categoria);
    if (filtros.status) p.set('status', filtros.status);
    if (filtros.adimplencia) p.set('adimplencia', filtros.adimplencia);
    return p.toString();
  }, [page, filtros]);

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api<PaginatedTransacoes>(`/financeiro?${buildQuery()}`);
      setTransacoes(data.data);
      setMeta(data.meta);
    } finally {
      setLoading(false);
    }
  }, [buildQuery]);

  useEffect(() => {
    carregar().catch((e) => setErro(e instanceof Error ? e.message : t('erp.financeiro.loadError')));
  }, [carregar, t]);

  useEffect(() => {
    if (canWrite) {
      api<Pessoa[]>('/pessoas').then(setPessoas).catch(console.error);
    }
  }, [canWrite]);

  const categorias = form.tipo === 'RECEITA' ? CATEGORIAS_RECEITA : CATEGORIAS_DESPESA;

  const abrirEditar = (tx: Transacao) => {
    setEditId(tx.id);
    setForm({
      tipo: tx.tipo as 'RECEITA' | 'DESPESA',
      categoria: tx.categoria,
      valor: String(tx.valor),
      pessoaId: tx.pessoaId ? String(tx.pessoaId) : '',
      dataTransacao: tx.dataTransacao.slice(0, 10),
      vencimento: tx.vencimento?.slice(0, 10) ?? '',
      observacoes: tx.observacoes ?? '',
    });
    setMostrarForm(true);
  };

  const salvar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    const body = {
      tipo: form.tipo,
      categoria: form.categoria,
      valor: Number(form.valor),
      pessoaId: form.pessoaId ? Number(form.pessoaId) : undefined,
      dataTransacao: form.dataTransacao,
      vencimento: form.vencimento || undefined,
      observacoes: form.observacoes || undefined,
    };
    try {
      if (editId) {
        await api(`/financeiro/${editId}`, { method: 'PUT', body: JSON.stringify(body) });
      } else {
        await api('/financeiro', { method: 'POST', body: JSON.stringify(body) });
      }
      setMostrarForm(false);
      setEditId(null);
      setForm(emptyForm());
      await carregar();
    } catch (err) {
      setErro(err instanceof Error ? err.message : t('erp.financeiro.saveError'));
    }
  };

  const excluir = async (id: number) => {
    if (!window.confirm(t('erp.financeiro.confirmDelete'))) return;
    setErro('');
    try {
      await api(`/financeiro/${id}`, { method: 'DELETE' });
      await carregar();
    } catch (err) {
      setErro(err instanceof Error ? err.message : t('erp.financeiro.deleteError'));
    }
  };

  const marcarPago = async (id: number) => {
    await api(`/financeiro/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'CONCLUIDO' }),
    });
    await carregar();
  };

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
      return;
    }
    setImportMsg(t('erp.financeiro.importSuccess', { count: data.linhas_importadas }));
    await carregar();
    e.target.value = '';
  };

  const syncAlertas = async () => {
    const res = await api<{ criados: number }>('/financeiro/sync-alertas', { method: 'POST' });
    alert(t('erp.financeiro.alertsGenerated', { count: res.criados }));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 justify-end">
        {canWrite && (
          <>
            <button
              type="button"
              onClick={() => {
                setEditId(null);
                setForm(emptyForm());
                setMostrarForm(true);
              }}
              className="px-4 py-2 bg-[var(--color-accent)] text-black rounded text-sm"
            >
              {t('erp.financeiro.newTx')}
            </button>
            <label className="px-4 py-2 bg-white/10 rounded text-sm cursor-pointer">
              {t('erp.financeiro.importExcel')}
              <input type="file" accept=".xlsx" className="hidden" onChange={importarExcel} />
            </label>
            <button type="button" onClick={syncAlertas} className="px-4 py-2 bg-white/10 rounded text-sm">
              {t('erp.financeiro.syncAlerts')}
            </button>
          </>
        )}
      </div>

      {erro && <p className="text-[var(--color-danger)] text-sm">{erro}</p>}
      {importMsg && <p className="text-[var(--color-success)] text-sm">{importMsg}</p>}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        <input
          type="date"
          value={filtros.de}
          onChange={(e) => {
            setPage(1);
            setFiltros((f) => ({ ...f, de: e.target.value }));
          }}
          className="px-2 py-2 rounded bg-black/30 border border-white/20 text-sm"
          aria-label={t('erp.financeiro.filterFrom')}
        />
        <input
          type="date"
          value={filtros.ate}
          onChange={(e) => {
            setPage(1);
            setFiltros((f) => ({ ...f, ate: e.target.value }));
          }}
          className="px-2 py-2 rounded bg-black/30 border border-white/20 text-sm"
          aria-label={t('erp.financeiro.filterTo')}
        />
        <select
          value={filtros.tipo}
          onChange={(e) => {
            setPage(1);
            setFiltros((f) => ({ ...f, tipo: e.target.value }));
          }}
          className="px-2 py-2 rounded bg-black/30 border border-white/20 text-sm"
        >
          <option value="">{t('erp.financeiro.allTypes')}</option>
          <option value="RECEITA">{t('erp.financeiro.revenue')}</option>
          <option value="DESPESA">{t('erp.financeiro.expense')}</option>
        </select>
        <select
          value={filtros.status}
          onChange={(e) => {
            setPage(1);
            setFiltros((f) => ({ ...f, status: e.target.value }));
          }}
          className="px-2 py-2 rounded bg-black/30 border border-white/20 text-sm"
        >
          <option value="">{t('erp.financeiro.allStatus')}</option>
          <option value="PENDENTE">{labelEnum(t, 'txStatus', 'PENDENTE')}</option>
          <option value="CONCLUIDO">{labelEnum(t, 'txStatus', 'CONCLUIDO')}</option>
        </select>
        <select
          value={filtros.adimplencia}
          onChange={(e) => {
            setPage(1);
            setFiltros((f) => ({ ...f, adimplencia: e.target.value }));
          }}
          className="px-2 py-2 rounded bg-black/30 border border-white/20 text-sm"
        >
          <option value="">{t('erp.financeiro.allCompliance')}</option>
          {ADIMPLENCIAS.map((a) => (
            <option key={a} value={a}>
              {labelEnum(t, 'adimplencia', a)}
            </option>
          ))}
        </select>
        <input
          type="text"
          value={filtros.categoria}
          onChange={(e) => {
            setPage(1);
            setFiltros((f) => ({ ...f, categoria: e.target.value }));
          }}
          placeholder={t('erp.financeiro.colCategory')}
          className="px-2 py-2 rounded bg-black/30 border border-white/20 text-sm"
        />
      </div>

      {mostrarForm && canWrite && (
        <form onSubmit={salvar} className="bg-[var(--color-surface)] p-4 rounded-xl space-y-3 max-w-lg">
          <h3 className="text-[var(--color-accent)] font-medium">
            {editId ? t('erp.financeiro.editTx') : t('erp.financeiro.newTx')}
          </h3>
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
            className="w-full px-3 py-2 rounded bg-black/30 border border-white/20"
          />
          <div className="flex gap-2">
            <button type="submit" className="px-4 py-2 bg-[var(--color-accent)] text-black rounded text-sm">
              {t('erp.common.save')}
            </button>
            <button
              type="button"
              onClick={() => {
                setMostrarForm(false);
                setEditId(null);
              }}
              className="px-4 py-2 bg-white/10 rounded text-sm"
            >
              {t('erp.common.cancel')}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="text-white/50 text-sm">{t('erp.common.loading')}</p>
      ) : (
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
                    {tx.vencimento
                      ? new Date(tx.vencimento).toLocaleDateString(dateLocale)
                      : t('erp.common.emptyDash')}
                  </td>
                  <td className="p-2">
                    <AdimplenciaBadge status={tx.adimplencia} />
                  </td>
                  {canWrite && (
                    <td className="p-2 space-x-2 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => abrirEditar(tx)}
                        className="text-[var(--color-accent)] hover:underline text-xs"
                      >
                        {t('erp.common.edit')}
                      </button>
                      <button
                        type="button"
                        onClick={() => excluir(tx.id)}
                        className="text-[var(--color-danger)] hover:underline text-xs"
                      >
                        {t('erp.common.delete')}
                      </button>
                      {tx.status === 'PENDENTE' && (
                        <button
                          type="button"
                          onClick={() => marcarPago(tx.id)}
                          className="text-emerald-400 hover:underline text-xs"
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
      )}

      {meta.totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 text-sm">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="px-3 py-1 rounded bg-white/10 disabled:opacity-40"
          >
            {t('erp.financeiro.prevPage')}
          </button>
          <span className="text-white/70">
            {t('erp.financeiro.pageOf', { page: meta.page, total: meta.totalPages })}
          </span>
          <button
            type="button"
            disabled={page >= meta.totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="px-3 py-1 rounded bg-white/10 disabled:opacity-40"
          >
            {t('erp.financeiro.nextPage')}
          </button>
        </div>
      )}
    </div>
  );
}
