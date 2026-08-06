import { useCallback, useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { downloadApi } from '../../lib/api-download';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../i18n/I18nContext';
import { formatMoney } from '../../i18n/helpers';
import { mesAnoAtual } from '../../lib/financeiro-utils';
import type { ConciliacaoResponse } from '../../types/financeiro';

interface MesHistorico {
  mes: number;
  ano: number;
  fechado: boolean;
}

export default function FinanceiroConciliacaoPage() {
  const { t, locale, dateLocale } = useI18n();
  const { user } = useAuth();
  const canWrite = user?.setorAcesso === 'DIRETORIA' || user?.setorAcesso === 'FINANCEIRO' || user?.setorAcesso === 'TESOURARIA';
  const isDiretoria = user?.setorAcesso === 'DIRETORIA';

  const init = mesAnoAtual();
  const [mes, setMes] = useState(init.mes);
  const [ano, setAno] = useState(init.ano);
  const [data, setData] = useState<ConciliacaoResponse | null>(null);
  const [historico, setHistorico] = useState<MesHistorico[]>([]);
  const [observacoes, setObservacoes] = useState('');
  const [erro, setErro] = useState('');
  const [msg, setMsg] = useState('');

  const carregar = useCallback(async () => {
    setErro('');
    try {
      const res = await api<ConciliacaoResponse>(`/financeiro/conciliacao?mes=${mes}&ano=${ano}`);
      setData(res);
    } catch (e) {
      setErro(e instanceof Error ? e.message : t('erp.financeiro.loadError'));
    }
  }, [mes, ano, t]);

  const carregarHistorico = useCallback(async () => {
    const items: MesHistorico[] = [];
    let m = mes;
    let y = ano;
    for (let i = 0; i < 12; i++) {
      try {
        const r = await api<ConciliacaoResponse>(`/financeiro/conciliacao?mes=${m}&ano=${y}`);
        items.push({ mes: m, ano: y, fechado: !!r.fechamento });
      } catch {
        items.push({ mes: m, ano: y, fechado: false });
      }
      m -= 1;
      if (m < 1) {
        m = 12;
        y -= 1;
      }
    }
    setHistorico(items);
  }, [mes, ano]);

  useEffect(() => {
    carregar();
    carregarHistorico();
  }, [carregar, carregarHistorico]);

  const fecharMes = async () => {
    if (!window.confirm(t('erp.financeiro.conciliacao.confirmClose'))) return;
    setErro('');
    setMsg('');
    try {
      await api('/financeiro/conciliacao/fechar', {
        method: 'POST',
        body: JSON.stringify({ mes, ano, observacoes: observacoes || undefined }),
      });
      setMsg(t('erp.financeiro.conciliacao.closedOk'));
      setObservacoes('');
      await carregar();
      await carregarHistorico();
    } catch (e) {
      setErro(e instanceof Error ? e.message : t('erp.financeiro.saveError'));
    }
  };

  const reabrirMes = async () => {
    if (!window.confirm(t('erp.financeiro.conciliacao.confirmReopen'))) return;
    setErro('');
    try {
      await api(`/financeiro/conciliacao/${ano}/${mes}`, { method: 'DELETE' });
      setMsg(t('erp.financeiro.conciliacao.reopenedOk'));
      await carregar();
      await carregarHistorico();
    } catch (e) {
      setErro(e instanceof Error ? e.message : t('erp.financeiro.saveError'));
    }
  };

  const exportar = async (fmt: 'csv' | 'pdf') => {
    setErro('');
    try {
      const path = `/financeiro/export.${fmt}?mes=${mes}&ano=${ano}`;
      await downloadApi(path, `financeiro-${ano}-${String(mes).padStart(2, '0')}.${fmt}`);
    } catch (e) {
      setErro(e instanceof Error ? e.message : t('erp.financeiro.exportError'));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 items-center">
        <select
          value={mes}
          onChange={(e) => setMes(Number(e.target.value))}
          className="px-3 py-2 rounded bg-black/30 border border-white/20 text-sm"
        >
          {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
            <option key={m} value={m}>
              {String(m).padStart(2, '0')}
            </option>
          ))}
        </select>
        <input
          type="number"
          min={2020}
          value={ano}
          onChange={(e) => setAno(Number(e.target.value))}
          className="w-24 px-3 py-2 rounded bg-black/30 border border-white/20 text-sm"
        />
        {data?.fechamento && (
          <span className="px-2 py-1 rounded bg-emerald-700/40 text-xs">
            {t('erp.financeiro.conciliacao.badgeClosed')}
          </span>
        )}
      </div>

      {erro && <p className="text-[var(--color-danger)] text-sm">{erro}</p>}
      {msg && <p className="text-[var(--color-success)] text-sm">{msg}</p>}

      {data && (
        <>
          <div className="bg-[var(--color-surface)] p-4 rounded-xl space-y-2">
            <h3 className="text-[var(--color-accent)] font-medium">{t('erp.financeiro.conciliacao.checklist')}</h3>
            <ul className="text-sm space-y-1">
              <li>
                {t('erp.financeiro.conciliacao.pendingFees')}: {data.checklist.mensalidadesPendentes}
              </li>
              <li>
                {t('erp.financeiro.conciliacao.overdue')}: {data.checklist.atrasados}
              </li>
              <li>
                {t('erp.financeiro.conciliacao.expensesMonth')}: {data.checklist.despesasNoMes}
              </li>
            </ul>
            <div className="pt-2 border-t border-white/10 text-sm grid sm:grid-cols-3 gap-2">
              <span>
                {t('erp.financeiro.kpi.receitas')}: {formatMoney(locale, data.totais.receitas)}
              </span>
              <span>
                {t('erp.financeiro.kpi.despesas')}: {formatMoney(locale, data.totais.despesas)}
              </span>
              <span>
                {t('erp.financeiro.kpi.saldo')}: {formatMoney(locale, data.totais.saldo)}
              </span>
            </div>
            {data.fechamento && (
              <p className="text-xs text-white/60">
                {t('erp.financeiro.conciliacao.closedBy', {
                  user: data.fechamento.fechadoPor.nome,
                  date: new Date(data.fechamento.fechadoEm).toLocaleDateString(dateLocale),
                })}
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => exportar('csv')}
              className="px-4 py-2 bg-white/10 rounded text-sm"
            >
              {t('erp.financeiro.exportCsv')}
            </button>
            <button
              type="button"
              onClick={() => exportar('pdf')}
              className="px-4 py-2 bg-white/10 rounded text-sm"
            >
              {t('erp.financeiro.exportPdf')}
            </button>
            {canWrite && !data.fechamento && (
              <>
                <input
                  type="text"
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  placeholder={t('erp.financeiro.conciliacao.notes')}
                  className="flex-1 min-w-[200px] px-3 py-2 rounded bg-black/30 border border-white/20 text-sm"
                />
                <button
                  type="button"
                  onClick={fecharMes}
                  className="px-4 py-2 bg-[var(--color-accent)] text-black rounded text-sm"
                >
                  {t('erp.financeiro.conciliacao.closeMonth')}
                </button>
              </>
            )}
            {isDiretoria && data.fechamento && (
              <button
                type="button"
                onClick={reabrirMes}
                className="px-4 py-2 bg-[var(--color-danger)]/80 text-white rounded text-sm"
              >
                {t('erp.financeiro.conciliacao.reopenMonth')}
              </button>
            )}
          </div>
        </>
      )}

      <div className="bg-[var(--color-surface)] p-4 rounded-xl">
        <h3 className="text-sm text-[var(--color-accent)] mb-2">{t('erp.financeiro.conciliacao.history')}</h3>
        <div className="flex flex-wrap gap-2">
          {historico.map((h) => (
            <button
              key={`${h.ano}-${h.mes}`}
              type="button"
              onClick={() => {
                setMes(h.mes);
                setAno(h.ano);
              }}
              className={`px-2 py-1 rounded text-xs ${
                h.mes === mes && h.ano === ano
                  ? 'bg-[var(--color-accent)] text-black'
                  : h.fechado
                    ? 'bg-emerald-800/50'
                    : 'bg-white/10'
              }`}
            >
              {String(h.mes).padStart(2, '0')}/{h.ano}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
