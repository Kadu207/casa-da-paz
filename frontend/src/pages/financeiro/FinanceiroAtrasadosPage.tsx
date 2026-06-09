import { useCallback, useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../i18n/I18nContext';
import { formatMoney, labelEnum } from '../../i18n/helpers';
import { AdimplenciaBadge } from '../../components/financeiro/AdimplenciaBadge';
import { diasAtraso } from '../../lib/financeiro-utils';
import type { Transacao } from '../../types/financeiro';

export default function FinanceiroAtrasadosPage() {
  const { t, locale, dateLocale } = useI18n();
  const { user } = useAuth();
  const canWrite = user?.setorAcesso === 'DIRETORIA' || user?.setorAcesso === 'FINANCEIRO';

  const [lista, setLista] = useState<Transacao[]>([]);
  const [selecionados, setSelecionados] = useState<Set<number>>(new Set());
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api<Transacao[]>('/financeiro/atrasados');
      setLista(data);
      setSelecionados(new Set());
    } catch (e) {
      setErro(e instanceof Error ? e.message : t('erp.financeiro.loadError'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const totalAberto = lista.reduce((s, tx) => s + Number(tx.valor), 0);

  const toggle = (id: number) => {
    setSelecionados((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selecionados.size === lista.length) {
      setSelecionados(new Set());
    } else {
      setSelecionados(new Set(lista.map((x) => x.id)));
    }
  };

  const batchPagar = async () => {
    if (selecionados.size === 0) return;
    setErro('');
    try {
      await api('/financeiro/batch/status', {
        method: 'POST',
        body: JSON.stringify({ ids: [...selecionados], status: 'CONCLUIDO' }),
      });
      await carregar();
    } catch (e) {
      setErro(e instanceof Error ? e.message : t('erp.financeiro.saveError'));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4 items-center justify-between bg-[var(--color-surface)] p-4 rounded-xl">
        <div>
          <p className="text-sm text-white/70">
            {t('erp.financeiro.atrasados.summary', { count: lista.length })}
          </p>
          <p className="text-lg font-serif text-[var(--color-accent)]">
            {t('erp.financeiro.atrasados.totalOpen')}: {formatMoney(locale, totalAberto)}
          </p>
        </div>
        {canWrite && lista.length > 0 && (
          <div className="flex gap-2">
            <button type="button" onClick={toggleAll} className="px-3 py-2 bg-white/10 rounded text-sm">
              {t('erp.financeiro.selectAll')}
            </button>
            <button
              type="button"
              disabled={selecionados.size === 0}
              onClick={batchPagar}
              className="px-4 py-2 bg-[var(--color-accent)] text-black rounded text-sm disabled:opacity-40"
            >
              {t('erp.financeiro.batchPay', { count: selecionados.size })}
            </button>
          </div>
        )}
      </div>

      {erro && <p className="text-[var(--color-danger)] text-sm">{erro}</p>}
      {loading ? (
        <p className="text-white/50 text-sm">{t('erp.common.loading')}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b border-white/20">
                {canWrite && <th className="p-2 w-8" />}
                <th className="p-2">{t('erp.common.person')}</th>
                <th className="p-2">{t('erp.common.value')}</th>
                <th className="p-2">{t('erp.common.dueDate')}</th>
                <th className="p-2">{t('erp.financeiro.colDaysLate')}</th>
                <th className="p-2">{t('erp.financeiro.colCategory')}</th>
                <th className="p-2">{t('erp.financeiro.colCompliance')}</th>
              </tr>
            </thead>
            <tbody>
              {lista.map((tx) => (
                <tr key={tx.id} className="border-b border-white/10">
                  {canWrite && (
                    <td className="p-2">
                      <input
                        type="checkbox"
                        checked={selecionados.has(tx.id)}
                        onChange={() => toggle(tx.id)}
                        aria-label={t('erp.financeiro.selectRow')}
                      />
                    </td>
                  )}
                  <td className="p-2">
                    <div>{tx.pessoa?.nomeCompleto ?? t('erp.common.emptyDash')}</div>
                    {tx.pessoa?.telefone && (
                      <div className="text-xs text-white/50">{tx.pessoa.telefone}</div>
                    )}
                  </td>
                  <td className="p-2">{formatMoney(locale, Number(tx.valor))}</td>
                  <td className="p-2">
                    {tx.vencimento
                      ? new Date(tx.vencimento).toLocaleDateString(dateLocale)
                      : t('erp.common.emptyDash')}
                  </td>
                  <td className="p-2">{diasAtraso(tx.vencimento) ?? t('erp.common.emptyDash')}</td>
                  <td className="p-2">{labelEnum(t, 'categoria', tx.categoria)}</td>
                  <td className="p-2">
                    <AdimplenciaBadge status={tx.adimplencia} />
                  </td>
                </tr>
              ))}
              {lista.length === 0 && (
                <tr>
                  <td colSpan={canWrite ? 7 : 6} className="p-4 text-center text-white/50">
                    {t('erp.financeiro.atrasados.none')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
