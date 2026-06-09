import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { api } from '../../lib/api';
import { useI18n } from '../../i18n/I18nContext';
import { formatMoney, formatMoneyShort, labelEnum } from '../../i18n/helpers';
import { mesAnoAtual } from '../../lib/financeiro-utils';
import type { FluxoCaixaResponse } from '../../types/financeiro';

export default function FinanceiroFluxoPage() {
  const { t, locale } = useI18n();
  const [searchParams] = useSearchParams();
  const init = mesAnoAtual();
  const qpMes = Number(searchParams.get('mes'));
  const qpAno = Number(searchParams.get('ano'));
  const [mes, setMes] = useState(
    Number.isFinite(qpMes) && qpMes >= 1 && qpMes <= 12 ? qpMes : init.mes
  );
  const [ano, setAno] = useState(Number.isFinite(qpAno) && qpAno >= 2020 ? qpAno : init.ano);
  const [data, setData] = useState<FluxoCaixaResponse | null>(null);
  const [erro, setErro] = useState('');

  const carregar = useCallback(async () => {
    setErro('');
    try {
      const res = await api<FluxoCaixaResponse>(`/financeiro/fluxo-caixa?mes=${mes}&ano=${ano}`);
      setData(res);
    } catch (e) {
      setErro(e instanceof Error ? e.message : t('erp.financeiro.loadError'));
    }
  }, [mes, ano, t]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const totais = data?.totais;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 items-center">
        <label className="text-sm text-white/70">{t('erp.financeiro.period')}</label>
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
          max={2100}
          value={ano}
          onChange={(e) => setAno(Number(e.target.value))}
          className="w-24 px-3 py-2 rounded bg-black/30 border border-white/20 text-sm"
        />
      </div>

      {erro && <p className="text-[var(--color-danger)] text-sm">{erro}</p>}

      {totais && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {[
              { label: t('erp.financeiro.kpi.receitas'), value: formatMoney(locale, totais.receitasConcluidas) },
              { label: t('erp.financeiro.kpi.despesas'), value: formatMoney(locale, totais.despesasConcluidas) },
              { label: t('erp.financeiro.kpi.saldo'), value: formatMoney(locale, totais.saldo) },
              { label: t('erp.financeiro.kpi.pendentes'), value: String(totais.pendentesQtd) },
              { label: t('erp.financeiro.kpi.atrasados'), value: String(totais.atrasadosQtd) },
            ].map((k) => (
              <div key={k.label} className="bg-[var(--color-surface)] p-3 rounded-xl">
                <p className="text-xs text-white/60">{k.label}</p>
                <p className="text-lg font-serif text-[var(--color-accent)]">{k.value}</p>
              </div>
            ))}
          </div>

          {data.porSemana.length > 0 && (
            <div className="bg-[var(--color-surface)] p-4 rounded-xl h-72">
              <p className="text-sm text-[var(--color-accent)] mb-2">{t('erp.financeiro.chart.weekly')}</p>
              <ResponsiveContainer width="100%" height="90%">
                <BarChart data={data.porSemana}>
                  <XAxis dataKey="semana" tick={{ fontSize: 10 }} />
                  <YAxis tickFormatter={(v) => formatMoneyShort(locale, v)} width={70} />
                  <Tooltip formatter={(v: number) => formatMoney(locale, v)} />
                  <Legend />
                  <Bar dataKey="receitas" name={t('erp.financeiro.revenue')} fill="#D4AF37" />
                  <Bar dataKey="despesas" name={t('erp.financeiro.expense')} fill="#64748B" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {data.porSemana.length > 0 && (
            <div className="bg-[var(--color-surface)] p-4 rounded-xl h-64">
              <p className="text-sm text-[var(--color-accent)] mb-2">{t('erp.financeiro.chart.balance')}</p>
              <ResponsiveContainer width="100%" height="90%">
                <LineChart data={data.porSemana}>
                  <XAxis dataKey="semana" tick={{ fontSize: 10 }} />
                  <YAxis tickFormatter={(v) => formatMoneyShort(locale, v)} width={70} />
                  <Tooltip formatter={(v: number) => formatMoney(locale, v)} />
                  <Line type="monotone" dataKey="saldoAcumulado" name={t('erp.financeiro.kpi.saldo')} stroke="#22C55E" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-4">
            {(['receitas', 'despesas'] as const).map((tipo) => (
              <div key={tipo} className="bg-[var(--color-surface)] p-4 rounded-xl">
                <h3 className="text-sm text-[var(--color-accent)] mb-2">
                  {tipo === 'receitas' ? t('erp.financeiro.revenue') : t('erp.financeiro.expense')}
                </h3>
                <ul className="text-sm space-y-1">
                  {data.porCategoria[tipo].map((c) => (
                    <li key={c.categoria} className="flex justify-between gap-2">
                      <span>{labelEnum(t, 'categoria', c.categoria)}</span>
                      <span>{formatMoney(locale, c.valor)}</span>
                    </li>
                  ))}
                  {data.porCategoria[tipo].length === 0 && (
                    <li className="text-white/50">{t('erp.financeiro.empty')}</li>
                  )}
                </ul>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
