import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { api } from '../lib/api';
import { mesAnoAtual } from '../lib/financeiro-utils';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../i18n/I18nContext';
import { formatMoneyShort, labelEnum } from '../i18n/helpers';
import type { ErpTranslationKey } from '../i18n/erp-pt-BR';
import MediumDashboardPanel from '../components/dashboard/MediumDashboardPanel';

const LEGEND_KEYS: ErpTranslationKey[] = [
  'erp.dashboard.legend.1',
  'erp.dashboard.legend.2',
  'erp.dashboard.legend.3',
  'erp.dashboard.legend.4',
  'erp.dashboard.legend.5',
  'erp.dashboard.legend.6',
  'erp.dashboard.legend.7',
  'erp.dashboard.legend.8',
  'erp.dashboard.legend.9',
  'erp.dashboard.legend.10',
];

const COLORS = ['#D4AF37', '#F59E0B', '#64748B', '#22C55E', '#3B82F6', '#EC4899'];

interface Resumo {
  periodo: { mes: number; ano: number; de: string; ate: string } | null;
  financeiro: {
    receitasConcluidas: number;
    despesasConcluidas: number;
    saldo: number;
    transacoesPendentes: number;
    transacoesAtrasadas: number;
  };
  operacional: {
    pessoasCadastradas: number;
    agendamentosPendentes: number;
    agendamentosConfirmados: number;
    agendamentosCancelados: number;
    eventosAbertos: number;
    visualizacoesEventos: number;
    inscricoesTotal: number;
    newsletterAtivos: number;
    presencasNoMes: number;
  };
  eventosRanking: {
    id: number;
    nomeEvento: string;
    visualizacoes: number;
    inscritos: number;
    taxaInscricao: number | null;
  }[];
  receitasPorCategoria: { categoria: string; valor: number }[];
  despesasPorCategoria: { categoria: string; valor: number }[];
}

function KpiCard({ label, value, hint }: { label: string; value: string | number; hint: string }) {
  return (
    <div className="bg-[var(--color-surface)] p-4 rounded-xl" title={hint}>
      <p className="text-xs text-white/60">{label}</p>
      <p className="text-xl sm:text-2xl font-serif text-[var(--color-accent)] break-words">{value}</p>
      <p className="text-[10px] text-white/40 mt-1 leading-snug">{hint}</p>
    </div>
  );
}

function Legenda() {
  const { t } = useI18n();
  return (
    <details className="bg-[var(--color-surface)] rounded-xl p-4 text-sm text-white/75">
      <summary className="cursor-pointer font-medium text-[var(--color-accent)]">{t('erp.dashboard.legendTitle')}</summary>
      <ul className="mt-3 space-y-2 list-disc pl-5">
        {LEGEND_KEYS.map((key) => (
          <li key={key}>{t(key)}</li>
        ))}
      </ul>
    </details>
  );
}

export default function DashboardPage() {
  const { t, locale, dateLocale } = useI18n();
  const { user } = useAuth();
  const init = mesAnoAtual();
  const [mes, setMes] = useState(init.mes);
  const [ano, setAno] = useState(init.ano);
  const [resumo, setResumo] = useState<Resumo | null>(null);
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);

  const fmt = (n: number) => formatMoneyShort(locale, n);

  const carregar = useCallback(async () => {
    if (user?.setorAcesso === 'MEDIUM') return;
    setLoading(true);
    setErro('');
    try {
      const data = await api<Resumo>(`/metricas/resumo?mes=${mes}&ano=${ano}`);
      setResumo(data);
    } catch (e) {
      setResumo(null);
      setErro(e instanceof Error ? e.message : t('erp.dashboard.loadError'));
    } finally {
      setLoading(false);
    }
  }, [mes, ano, user?.setorAcesso, t]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  if (user?.setorAcesso === 'MEDIUM') {
    return <MediumDashboardPanel />;
  }

  const periodoLabel = resumo?.periodo
    ? `${String(resumo.periodo.mes).padStart(2, '0')}/${resumo.periodo.ano}`
    : `${String(mes).padStart(2, '0')}/${ano}`;

  if (loading && !resumo) {
    return <p className="text-white/60">{t('erp.dashboard.loading')}</p>;
  }

  if (!resumo && erro) {
    return <p className="text-[var(--color-danger)] text-sm">{erro}</p>;
  }

  if (!resumo) {
    return <p className="text-white/60">{t('erp.dashboard.loading')}</p>;
  }

  const { financeiro: fin, operacional: op } = resumo;

  return (
    <div className="space-y-8 w-full min-w-0 max-w-full">
      <div className="flex flex-wrap gap-4 items-start justify-between">
        <div>
          <h2 className="text-xl font-serif text-[var(--color-accent)]">{t('erp.dashboard.title')}</h2>
          <p className="text-sm text-white/60 mt-1">
            {user?.setorAcesso === 'FINANCEIRO' || user?.setorAcesso === 'TESOURARIA'
              ? t('erp.dashboard.subtitleTreasury')
              : t('erp.dashboard.subtitleBoard')}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <label className="text-sm text-white/70">{t('erp.dashboard.period')}</label>
          <select
            value={mes}
            onChange={(e) => setMes(Number(e.target.value))}
            className="px-3 py-2 rounded bg-black/30 border border-white/20 text-sm"
            aria-label={t('erp.dashboard.period')}
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
            aria-label={t('erp.dashboard.year')}
          />
          {(user?.setorAcesso === 'FINANCEIRO' ||
            user?.setorAcesso === 'TESOURARIA' ||
            user?.setorAcesso === 'DIRETORIA') && (
            <Link
              to={`/app/financeiro/fluxo?mes=${mes}&ano=${ano}`}
              className="px-3 py-2 rounded bg-white/10 text-sm hover:bg-white/20"
            >
              {t('erp.dashboard.linkFluxo')}
            </Link>
          )}
        </div>
      </div>

      {erro && <p className="text-[var(--color-danger)] text-sm">{erro}</p>}

      <p className="text-xs text-white/50">
        {t('erp.dashboard.periodFinanceHint', { period: periodoLabel })}
        {' · '}
        {t('erp.dashboard.periodOperationalHint')}
      </p>

      <Legenda />

      <section>
        <h3 className="text-lg font-serif text-[var(--color-accent)] mb-3">
          {t('erp.dashboard.finance')} — {periodoLabel}
        </h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <KpiCard
            label={t('erp.dashboard.kpi.revenue')}
            value={fmt(fin.receitasConcluidas)}
            hint={t('erp.dashboard.hint.revenuePeriod')}
          />
          <KpiCard
            label={t('erp.dashboard.kpi.expense')}
            value={fmt(fin.despesasConcluidas)}
            hint={t('erp.dashboard.hint.expensePeriod')}
          />
          <KpiCard
            label={t('erp.dashboard.kpi.balance')}
            value={fmt(fin.saldo)}
            hint={t('erp.dashboard.hint.balancePeriod')}
          />
          <KpiCard
            label={t('erp.dashboard.kpi.pending')}
            value={fin.transacoesPendentes}
            hint={t('erp.dashboard.hint.pendingPeriod')}
          />
          <KpiCard
            label={t('erp.dashboard.kpi.overdue')}
            value={fin.transacoesAtrasadas}
            hint={t('erp.dashboard.hint.overdue')}
          />
        </div>
      </section>

      <section>
        <h3 className="text-lg font-serif text-[var(--color-accent)] mb-3">{t('erp.dashboard.operational')}</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            label={t('erp.dashboard.kpi.people')}
            value={op.pessoasCadastradas}
            hint={t('erp.dashboard.hint.people')}
          />
          <KpiCard
            label={t('erp.dashboard.kpi.apptPending')}
            value={op.agendamentosPendentes}
            hint={t('erp.dashboard.hint.apptPending')}
          />
          <KpiCard
            label={t('erp.dashboard.kpi.apptConfirmed')}
            value={op.agendamentosConfirmados}
            hint={t('erp.dashboard.hint.apptConfirmed')}
          />
          <KpiCard
            label={t('erp.dashboard.kpi.apptCancelled')}
            value={op.agendamentosCancelados}
            hint={t('erp.dashboard.hint.apptCancelled')}
          />
          <KpiCard
            label={t('erp.dashboard.kpi.openEvents')}
            value={op.eventosAbertos}
            hint={t('erp.dashboard.hint.openEvents')}
          />
          <KpiCard
            label={t('erp.dashboard.kpi.eventViews')}
            value={op.visualizacoesEventos}
            hint={t('erp.dashboard.hint.eventViews')}
          />
          <KpiCard
            label={t('erp.dashboard.kpi.registrations')}
            value={op.inscricoesTotal}
            hint={t('erp.dashboard.hint.registrations')}
          />
          <KpiCard
            label={t('erp.dashboard.kpi.newsletter')}
            value={op.newsletterAtivos}
            hint={t('erp.dashboard.hint.newsletter')}
          />
          <KpiCard
            label={t('erp.dashboard.kpi.attendance')}
            value={op.presencasNoMes}
            hint={
              resumo.periodo
                ? t('erp.dashboard.hint.attendancePeriod', {
                    from: new Date(resumo.periodo.de).toLocaleDateString(dateLocale),
                    to: new Date(resumo.periodo.ate).toLocaleDateString(dateLocale),
                  })
                : t('erp.dashboard.hint.attendance')
            }
          />
        </div>
      </section>

      <section>
        <h3 className="text-lg font-serif text-[var(--color-accent)] mb-3">{t('erp.dashboard.chart.eventsTop')}</h3>
        <div className="chart-panel bg-[var(--color-surface)] p-3 sm:p-4 rounded-xl h-64 sm:h-80">
          <ResponsiveContainer width="100%" height="100%" debounce={50}>
            <BarChart
              data={resumo.eventosRanking.map((e) => ({
                name: e.nomeEvento.slice(0, 12),
                views: e.visualizacoes,
                inscritos: e.inscritos,
              }))}
              margin={{ top: 8, right: 8, left: 0, bottom: 48 }}
            >
              <XAxis
                dataKey="name"
                stroke="#94a3b8"
                interval={0}
                angle={-35}
                textAnchor="end"
                height={56}
                tick={{ fontSize: 11 }}
              />
              <YAxis stroke="#94a3b8" />
              <Tooltip />
              <Legend />
              <Bar dataKey="views" fill="#D4AF37" name={t('erp.dashboard.chart.views')} radius={4} />
              <Bar dataKey="inscritos" fill="#64748B" name={t('erp.dashboard.chart.registered')} radius={4} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="grid gap-8 lg:grid-cols-2 min-w-0">
        <div className="min-w-0">
          <h3 className="text-lg font-serif text-[var(--color-accent)] mb-3">
            {t('erp.dashboard.chart.revenueByCat')} — {periodoLabel}
          </h3>
          <div className="chart-panel bg-[var(--color-surface)] p-3 sm:p-4 rounded-xl h-64 sm:h-72">
            {resumo.receitasPorCategoria.length === 0 ? (
              <p className="text-white/50 text-sm p-4">{t('erp.dashboard.emptyPeriod')}</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%" debounce={50}>
                <BarChart
                  data={resumo.receitasPorCategoria.map((r) => ({
                    ...r,
                    categoriaLabel: labelEnum(t, 'categoria', r.categoria),
                  }))}
                  layout="vertical"
                  margin={{ left: 8, right: 8 }}
                >
                  <XAxis type="number" stroke="#94a3b8" tickFormatter={(v) => fmt(v)} tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="categoriaLabel" width={72} stroke="#94a3b8" tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: number) => fmt(v)} />
                  <Bar dataKey="valor" fill="#D4AF37" radius={4} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
        <div className="min-w-0">
          <h3 className="text-lg font-serif text-[var(--color-accent)] mb-3">
            {t('erp.dashboard.chart.expenseByCat')} — {periodoLabel}
          </h3>
          <div className="chart-panel bg-[var(--color-surface)] p-3 sm:p-4 rounded-xl h-64 sm:h-72">
            {resumo.despesasPorCategoria.length === 0 ? (
              <p className="text-white/50 text-sm p-4">{t('erp.dashboard.emptyPeriod')}</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%" debounce={50}>
                <PieChart>
                  <Pie
                    data={resumo.despesasPorCategoria.map((d) => ({
                      ...d,
                      categoriaLabel: labelEnum(t, 'categoria', d.categoria),
                    }))}
                    dataKey="valor"
                    nameKey="categoriaLabel"
                    cx="50%"
                    cy="50%"
                    outerRadius="70%"
                    label={({ categoriaLabel }) => `${String(categoriaLabel).slice(0, 10)}`}
                  >
                    {resumo.despesasPorCategoria.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => fmt(v)} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
