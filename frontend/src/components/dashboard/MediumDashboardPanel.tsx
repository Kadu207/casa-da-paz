import { useCallback, useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { useI18n } from '../../i18n/I18nContext';
import { formatMoney, labelEnum } from '../../i18n/helpers';
import { AdimplenciaBadge } from '../financeiro/AdimplenciaBadge';
import type { MeuPainelResponse } from '../../types/meu-painel';

function KpiCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-[var(--color-surface)] p-4 rounded-xl">
      <p className="text-xs text-white/60">{label}</p>
      <p className="text-xl font-serif text-[var(--color-accent)]">{value}</p>
    </div>
  );
}

export default function MediumDashboardPanel() {
  const { t, locale, dateLocale } = useI18n();
  const [data, setData] = useState<MeuPainelResponse | null>(null);
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(true);

  const carregar = useCallback(async () => {
    setLoading(true);
    setErro('');
    try {
      const res = await api<MeuPainelResponse>('/metricas/meu-painel');
      setData(res);
    } catch (e) {
      setErro(e instanceof Error ? e.message : t('erp.medium.loadError'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  if (loading && !data) {
    return <p className="text-white/60">{t('erp.dashboard.loading')}</p>;
  }

  if (erro && !data) {
    return <p className="text-[var(--color-danger)] text-sm">{erro}</p>;
  }

  if (!data) return null;

  const { resumo, mensalidades } = data.financeiro;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-serif text-[var(--color-accent)]">{t('erp.dashboard.myPanel')}</h2>
        <p className="text-sm text-white/70 mt-1">{data.pessoa.nomeCompleto}</p>
      </div>

      {erro && <p className="text-[var(--color-danger)] text-sm">{erro}</p>}

      <section>
        <h3 className="text-lg font-serif text-[var(--color-accent)] mb-3">{t('erp.medium.fees')}</h3>
        <div className="grid gap-4 sm:grid-cols-3">
          <KpiCard label={t('erp.medium.kpi.paid')} value={formatMoney(locale, resumo.totalPago)} />
          <KpiCard label={t('erp.medium.kpi.pending')} value={formatMoney(locale, resumo.totalPendente)} />
          <KpiCard label={t('erp.medium.kpi.overdue')} value={resumo.atrasadosQtd} />
        </div>
      </section>

      <section className="bg-[var(--color-surface)] rounded-xl overflow-x-auto">
        <h3 className="text-sm text-[var(--color-accent)] p-4 pb-2">{t('erp.medium.feeHistory')}</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b border-white/20">
              <th className="p-2">{t('erp.common.dueDate')}</th>
              <th className="p-2">{t('erp.common.value')}</th>
              <th className="p-2">{t('erp.common.status')}</th>
              <th className="p-2">{t('erp.financeiro.colCompliance')}</th>
            </tr>
          </thead>
          <tbody>
            {mensalidades.map((m) => (
              <tr key={m.id} className="border-b border-white/10">
                <td className="p-2">
                  {m.vencimento
                    ? new Date(m.vencimento).toLocaleDateString(dateLocale)
                    : new Date(m.dataTransacao).toLocaleDateString(dateLocale)}
                </td>
                <td className="p-2">{formatMoney(locale, m.valor)}</td>
                <td className="p-2">{labelEnum(t, 'txStatus', m.status)}</td>
                <td className="p-2">
                  <AdimplenciaBadge status={m.adimplencia} />
                </td>
              </tr>
            ))}
            {mensalidades.length === 0 && (
              <tr>
                <td colSpan={4} className="p-4 text-center text-white/50">
                  {t('erp.medium.noFees')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      <section className="bg-[var(--color-surface)] rounded-xl overflow-x-auto">
        <h3 className="text-sm text-[var(--color-accent)] p-4 pb-2">{t('erp.medium.attendance')}</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b border-white/20">
              <th className="p-2">{t('erp.medium.col.event')}</th>
              <th className="p-2">{t('erp.medium.col.date')}</th>
              <th className="p-2">{t('erp.medium.col.type')}</th>
            </tr>
          </thead>
          <tbody>
            {data.presencas.map((p) => (
              <tr key={p.id} className="border-b border-white/10">
                <td className="p-2">{p.eventoNome}</td>
                <td className="p-2">{new Date(p.horarioChegada).toLocaleString(dateLocale)}</td>
                <td className="p-2">{labelEnum(t, 'presenca', p.tipoPresenca)}</td>
              </tr>
            ))}
            {data.presencas.length === 0 && (
              <tr>
                <td colSpan={3} className="p-4 text-center text-white/50">
                  {t('erp.medium.noAttendance')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      <section className="bg-[var(--color-surface)] rounded-xl overflow-x-auto">
        <h3 className="text-sm text-[var(--color-accent)] p-4 pb-2">{t('erp.medium.registrations')}</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b border-white/20">
              <th className="p-2">{t('erp.medium.col.event')}</th>
              <th className="p-2">{t('erp.common.value')}</th>
              <th className="p-2">{t('erp.common.dueDate')}</th>
              <th className="p-2">{t('erp.financeiro.colCompliance')}</th>
            </tr>
          </thead>
          <tbody>
            {data.inscricoes.map((i) => (
              <tr key={i.id} className="border-b border-white/10">
                <td className="p-2">{i.eventoNome}</td>
                <td className="p-2">{formatMoney(locale, i.valor)}</td>
                <td className="p-2">
                  {i.vencimento
                    ? new Date(i.vencimento).toLocaleDateString(dateLocale)
                    : t('erp.common.emptyDash')}
                </td>
                <td className="p-2">
                  <AdimplenciaBadge status={i.adimplencia} />
                </td>
              </tr>
            ))}
            {data.inscricoes.length === 0 && (
              <tr>
                <td colSpan={4} className="p-4 text-center text-white/50">
                  {t('erp.medium.noRegistrations')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
