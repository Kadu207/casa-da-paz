import { useCallback, useEffect, useState } from 'react';
import { getToken } from '../lib/api';
import { useI18n } from '../i18n/I18nContext';
import { labelEnum } from '../i18n/helpers';

const API_BASE = import.meta.env.VITE_API_URL ?? '/api';

export interface AuditLogItem {
  id: number;
  setor: string | null;
  rota: string;
  rotaLabel: string;
  motivo: string | null;
  motivoLabel: string | null;
  ip: string | null;
  createdAt: string;
}

interface AuditResponse {
  page: number;
  limit: number;
  total: number;
  items: AuditLogItem[];
}

export interface AuditFilters {
  page: number;
  setor: string;
  rota: string;
  de: string;
  ate: string;
  q: string;
  sort: 'createdAt' | 'rota' | 'setor';
  order: 'asc' | 'desc';
}

const SETORES = ['DIRETORIA', 'FINANCEIRO', 'RECEPCAO', 'LIVRARIA', 'MEDIUM', 'SUPORTE'] as const;

function buildQuery(f: AuditFilters, locale: string, csv = false): string {
  const p = new URLSearchParams();
  p.set('locale', locale);
  if (!csv) {
    p.set('page', String(f.page));
    p.set('limit', '25');
  }
  p.set('sort', f.sort);
  p.set('order', f.order);
  if (f.setor) p.set('setor', f.setor);
  if (f.rota) p.set('rota', f.rota);
  if (f.de) p.set('de', f.de);
  if (f.ate) p.set('ate', f.ate);
  if (f.q) p.set('q', f.q);
  return p.toString();
}

export default function AuditoriaPage() {
  const { locale, t, dateLocale } = useI18n();
  const [filters, setFilters] = useState<AuditFilters>({
    page: 1,
    setor: '',
    rota: '',
    de: '',
    ate: '',
    q: '',
    sort: 'createdAt',
    order: 'desc',
  });
  const [draft, setDraft] = useState({ setor: '', rota: '', de: '', ate: '', q: '' });
  const [data, setData] = useState<AuditResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE}/auditoria?${buildQuery(filters, locale)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(t('erp.auditoria.loadError'));
      setData(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [filters, locale, t]);

  useEffect(() => {
    load();
  }, [load]);

  const applyFilters = () => {
    setFilters((f) => ({ ...f, ...draft, page: 1 }));
    setToast(t('erp.auditoria.filtersApplied'));
    setTimeout(() => setToast(null), 2500);
  };

  const clearFilters = () => {
    const empty = { setor: '', rota: '', de: '', ate: '', q: '' };
    setDraft(empty);
    setFilters((f) => ({ ...f, ...empty, page: 1 }));
  };

  const toggleSort = (col: AuditFilters['sort']) => {
    setFilters((f) => ({
      ...f,
      sort: col,
      order: f.sort === col && f.order === 'desc' ? 'asc' : 'desc',
      page: 1,
    }));
  };

  const exportCsv = async () => {
    const token = getToken();
    const res = await fetch(`${API_BASE}/auditoria/export.csv?${buildQuery(filters, locale, true)}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'auditoria-casa-da-paz.csv';
    a.click();
    URL.revokeObjectURL(url);
    load();
  };

  const exportPdf = async () => {
    const token = getToken();
    const res = await fetch(`${API_BASE}/auditoria/export.pdf?${buildQuery(filters, locale, true)}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'auditoria-casa-da-paz.pdf';
    a.click();
    URL.revokeObjectURL(url);
    load();
  };

  const totalPages = data ? Math.ceil(data.total / data.limit) : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-serif text-[var(--color-accent)]">{t('erp.auditoria.title')}</h2>
          <p className="text-sm text-white/60 mt-1">{t('erp.auditoria.subtitle')}</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={exportCsv}
            className="text-sm px-4 py-2 rounded bg-[var(--color-accent)] text-black hover:opacity-90"
          >
            {t('erp.auditoria.exportCsv')}
          </button>
          <button
            type="button"
            onClick={exportPdf}
            className="text-sm px-4 py-2 rounded border border-white/20 hover:bg-white/10"
          >
            {t('erp.auditoria.exportPdf')}
          </button>
        </div>
      </div>

      {toast && (
        <p className="text-sm text-green-400" role="status">
          {toast}
        </p>
      )}

      <div className="bg-[var(--color-surface)] p-4 rounded-xl space-y-3">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label className="text-xs text-white/60 block mb-1">{t('erp.auditoria.filterSector')}</label>
            <select
              value={draft.setor}
              onChange={(e) => setDraft((d) => ({ ...d, setor: e.target.value }))}
              className="w-full bg-black/30 border border-white/20 rounded px-3 py-2 text-sm"
            >
              <option value="">{t('erp.common.all')}</option>
              {SETORES.map((s) => (
                <option key={s} value={s}>
                  {labelEnum(t, 'setor', s)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-white/60 block mb-1">{t('erp.auditoria.filterRoute')}</label>
            <input
              value={draft.rota}
              onChange={(e) => setDraft((d) => ({ ...d, rota: e.target.value }))}
              className="w-full bg-black/30 border border-white/20 rounded px-3 py-2 text-sm"
              placeholder={t('erp.auditoria.routePlaceholder')}
            />
          </div>
          <div>
            <label className="text-xs text-white/60 block mb-1">{t('erp.auditoria.filterSearch')}</label>
            <input
              value={draft.q}
              onChange={(e) => setDraft((d) => ({ ...d, q: e.target.value }))}
              className="w-full bg-black/30 border border-white/20 rounded px-3 py-2 text-sm"
              placeholder={t('erp.auditoria.searchPlaceholder')}
            />
          </div>
          <div>
            <label className="text-xs text-white/60 block mb-1">{t('erp.auditoria.filterFrom')}</label>
            <input
              type="date"
              value={draft.de}
              onChange={(e) => setDraft((d) => ({ ...d, de: e.target.value }))}
              className="w-full bg-black/30 border border-white/20 rounded px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-white/60 block mb-1">{t('erp.auditoria.filterUntil')}</label>
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
            {t('erp.auditoria.applyFilters')}
          </button>
          <button type="button" onClick={clearFilters} className="text-sm px-4 py-2 rounded hover:bg-white/10">
            {t('erp.auditoria.clear')}
          </button>
        </div>
      </div>

      <div className="bg-[var(--color-surface)] rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-10 bg-white/5 rounded animate-pulse" />
            ))}
          </div>
        ) : !data?.items.length ? (
          <p className="p-8 text-center text-white/60">{t('erp.auditoria.empty')}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left text-white/60">
                  <th className="p-3 cursor-pointer hover:text-white" onClick={() => toggleSort('createdAt')}>
                    {t('erp.common.date')} {filters.sort === 'createdAt' && (filters.order === 'desc' ? '↓' : '↑')}
                  </th>
                  <th className="p-3 cursor-pointer hover:text-white" onClick={() => toggleSort('setor')}>
                    {t('erp.auditoria.filterSector')}{' '}
                    {filters.sort === 'setor' && (filters.order === 'desc' ? '↓' : '↑')}
                  </th>
                  <th className="p-3 cursor-pointer hover:text-white" onClick={() => toggleSort('rota')}>
                    {t('erp.auditoria.colRoute')} {filters.sort === 'rota' && (filters.order === 'desc' ? '↓' : '↑')}
                  </th>
                  <th className="p-3">{t('erp.auditoria.colReason')}</th>
                  <th className="p-3">{t('erp.auditoria.colIp')}</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((log) => (
                  <tr key={log.id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="p-3 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString(dateLocale)}
                    </td>
                    <td className="p-3">
                      {log.setor ? labelEnum(t, 'setor', log.setor) : t('erp.common.emptyDash')}
                    </td>
                    <td className="p-3">
                      <span title={log.rota}>{log.rotaLabel}</span>
                    </td>
                    <td className="p-3 max-w-xs truncate" title={log.motivo ?? undefined}>
                      {log.motivoLabel ?? t('erp.common.emptyDash')}
                    </td>
                    <td className="p-3 font-mono text-xs">{log.ip ?? t('erp.common.emptyDash')}</td>
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
            {t('erp.auditoria.pagination', {
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
              {t('erp.auditoria.prev')}
            </button>
            <button
              type="button"
              disabled={data.page >= totalPages}
              onClick={() => setFilters((f) => ({ ...f, page: f.page + 1 }))}
              className="px-3 py-1 rounded border border-white/20 disabled:opacity-40"
            >
              {t('erp.auditoria.next')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
