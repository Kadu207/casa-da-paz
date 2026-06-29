import { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api';
import { hasPermission, useAuth } from '../context/AuthContext';
import { useI18n } from '../i18n/I18nContext';

export interface AlertaItem {
  id: number;
  tipo: string;
  mensagem: string;
  pessoaId: number | null;
  pessoa: { nomeCompleto: string; telefone: string | null } | null;
  canal: string;
  disparado: boolean;
  createdAt: string;
}

interface AlertasResponse {
  page: number;
  limit: number;
  total: number;
  items: AlertaItem[];
}

interface AlertasFilters {
  page: number;
  tipo: string;
  disparado: '' | 'true' | 'false';
  de: string;
  ate: string;
  sort: 'createdAt' | 'tipo';
  order: 'asc' | 'desc';
}

function buildQuery(f: AlertasFilters): string {
  const p = new URLSearchParams();
  p.set('page', String(f.page));
  p.set('limit', '25');
  p.set('sort', f.sort);
  p.set('order', f.order);
  if (f.tipo) p.set('tipo', f.tipo);
  if (f.disparado) p.set('disparado', f.disparado);
  if (f.de) p.set('de', f.de);
  if (f.ate) p.set('ate', f.ate);
  return p.toString();
}

export default function AlertasPage() {
  const { t, dateLocale } = useI18n();
  const { user } = useAuth();
  const canWrite = hasPermission(user, 'alertas', 'write');

  const [filters, setFilters] = useState<AlertasFilters>({
    page: 1,
    tipo: '',
    disparado: '',
    de: '',
    ate: '',
    sort: 'createdAt',
    order: 'desc',
  });
  const [draft, setDraft] = useState({ tipo: '', disparado: '' as '' | 'true' | 'false', de: '', ate: '' });
  const [data, setData] = useState<AlertasResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [toast, setToast] = useState<string | null>(null);
  const [actionId, setActionId] = useState<number | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const load = useCallback(async () => {
    setLoading(true);
    setErro('');
    try {
      const res = await api<AlertasResponse>(`/alertas?${buildQuery(filters)}`);
      setData(res);
    } catch (e) {
      setErro(e instanceof Error ? e.message : t('erp.alertas.loadError'));
    } finally {
      setLoading(false);
    }
  }, [filters, t]);

  useEffect(() => {
    load();
  }, [load]);

  const applyFilters = () => {
    setFilters((f) => ({ ...f, ...draft, page: 1 }));
    showToast(t('erp.alertas.filtersApplied'));
  };

  const clearFilters = () => {
    const empty = { tipo: '', disparado: '' as const, de: '', ate: '' };
    setDraft(empty);
    setFilters((f) => ({ ...f, ...empty, page: 1 }));
  };

  const marcarDisparado = async (id: number) => {
    setActionId(id);
    try {
      await api(`/alertas/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ disparado: true }),
      });
      showToast(t('erp.alertas.markedSent'));
      await load();
    } catch (e) {
      setErro(e instanceof Error ? e.message : t('erp.alertas.actionError'));
    } finally {
      setActionId(null);
    }
  };

  const reenviar = async (id: number) => {
    setActionId(id);
    try {
      const res = await api<{ enviado: boolean; motivo?: string }>(`/alertas/${id}/reenviar`, {
        method: 'POST',
      });
      if (res.enviado) {
        showToast(t('erp.alertas.resendOk'));
      } else {
        setErro(res.motivo ?? t('erp.alertas.resendFail'));
      }
      await load();
    } catch (e) {
      setErro(e instanceof Error ? e.message : t('erp.alertas.actionError'));
    } finally {
      setActionId(null);
    }
  };

  const totalPages = data ? Math.ceil(data.total / data.limit) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-serif text-[var(--color-accent)]">{t('erp.alertas.title')}</h3>
        <p className="text-sm text-white/60 mt-1">{t('erp.alertas.subtitle')}</p>
      </div>

      {erro && <p className="text-sm text-[var(--color-danger)]">{erro}</p>}
      {toast && (
        <p className="text-sm text-green-400" role="status">
          {toast}
        </p>
      )}

      <div className="bg-[var(--color-surface)] p-4 rounded-xl space-y-3">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="text-xs text-white/60 block mb-1">{t('erp.alertas.filterType')}</label>
            <input
              value={draft.tipo}
              onChange={(e) => setDraft((d) => ({ ...d, tipo: e.target.value }))}
              className="w-full bg-black/30 border border-white/20 rounded px-3 py-2 text-sm"
              placeholder={t('erp.alertas.typePlaceholder')}
            />
          </div>
          <div>
            <label className="text-xs text-white/60 block mb-1">{t('erp.alertas.filterStatus')}</label>
            <select
              value={draft.disparado}
              onChange={(e) =>
                setDraft((d) => ({ ...d, disparado: e.target.value as '' | 'true' | 'false' }))
              }
              className="w-full bg-black/30 border border-white/20 rounded px-3 py-2 text-sm"
            >
              <option value="">{t('erp.common.all')}</option>
              <option value="false">{t('erp.alertas.statusPending')}</option>
              <option value="true">{t('erp.alertas.statusSent')}</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-white/60 block mb-1">{t('erp.alertas.filterFrom')}</label>
            <input
              type="date"
              value={draft.de}
              onChange={(e) => setDraft((d) => ({ ...d, de: e.target.value }))}
              className="w-full bg-black/30 border border-white/20 rounded px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-white/60 block mb-1">{t('erp.alertas.filterUntil')}</label>
            <input
              type="date"
              value={draft.ate}
              onChange={(e) => setDraft((d) => ({ ...d, ate: e.target.value }))}
              className="w-full bg-black/30 border border-white/20 rounded px-3 py-2 text-sm"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={applyFilters}
            className="text-sm px-4 py-2 rounded bg-[var(--color-accent)] text-black"
          >
            {t('erp.alertas.applyFilters')}
          </button>
          <button type="button" onClick={clearFilters} className="text-sm px-4 py-2 rounded hover:bg-white/10">
            {t('erp.alertas.clear')}
          </button>
        </div>
      </div>

      <div className="bg-[var(--color-surface)] rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-10 bg-white/5 rounded animate-pulse" />
            ))}
          </div>
        ) : !data?.items.length ? (
          <p className="p-8 text-center text-white/60">{t('erp.alertas.empty')}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left text-white/60">
                  <th className="p-3">{t('erp.common.date')}</th>
                  <th className="p-3">{t('erp.alertas.colType')}</th>
                  <th className="p-3">{t('erp.alertas.colMessage')}</th>
                  <th className="p-3">{t('erp.alertas.colPerson')}</th>
                  <th className="p-3">{t('erp.alertas.colChannel')}</th>
                  <th className="p-3">{t('erp.alertas.colStatus')}</th>
                  {canWrite && <th className="p-3">{t('erp.alertas.colActions')}</th>}
                </tr>
              </thead>
              <tbody>
                {data.items.map((item) => (
                  <tr key={item.id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="p-3 whitespace-nowrap">
                      {new Date(item.createdAt).toLocaleString(dateLocale)}
                    </td>
                    <td className="p-3 font-mono text-xs">{item.tipo}</td>
                    <td className="p-3 max-w-xs">{item.mensagem}</td>
                    <td className="p-3">
                      {item.pessoa?.nomeCompleto ?? t('erp.common.emptyDash')}
                    </td>
                    <td className="p-3">{item.canal}</td>
                    <td className="p-3">
                      <span
                        className={`text-xs px-2 py-0.5 rounded ${
                          item.disparado
                            ? 'bg-green-900/40 text-green-300'
                            : 'bg-amber-900/40 text-amber-300'
                        }`}
                      >
                        {item.disparado ? t('erp.alertas.statusSent') : t('erp.alertas.statusPending')}
                      </span>
                    </td>
                    {canWrite && (
                      <td className="p-3">
                        <div className="flex flex-wrap gap-2">
                          {!item.disparado && (
                            <button
                              type="button"
                              disabled={actionId === item.id}
                              onClick={() => marcarDisparado(item.id)}
                              className="text-xs px-2 py-1 rounded border border-white/20 hover:bg-white/10 disabled:opacity-50"
                            >
                              {t('erp.alertas.markSent')}
                            </button>
                          )}
                          <button
                            type="button"
                            disabled={actionId === item.id}
                            onClick={() => reenviar(item.id)}
                            className="text-xs px-2 py-1 rounded bg-[var(--color-accent)] text-black disabled:opacity-50"
                          >
                            {t('erp.alertas.resend')}
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {data && totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <p className="text-white/60">
            {t('erp.alertas.pagination', {
              total: data.total,
              page: data.page,
              totalPages,
            })}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={data.page <= 1}
              onClick={() => setFilters((f) => ({ ...f, page: f.page - 1 }))}
              className="px-3 py-1 rounded border border-white/20 disabled:opacity-40"
            >
              {t('erp.alertas.prev')}
            </button>
            <button
              type="button"
              disabled={data.page >= totalPages}
              onClick={() => setFilters((f) => ({ ...f, page: f.page + 1 }))}
              className="px-3 py-1 rounded border border-white/20 disabled:opacity-40"
            >
              {t('erp.alertas.next')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
