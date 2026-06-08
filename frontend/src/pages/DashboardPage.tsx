import { useEffect, useState } from 'react';
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
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../i18n/I18nContext';
import { formatMoneyShort, labelEnum } from '../i18n/helpers';
import type { ErpTranslationKey } from '../i18n/erp-pt-BR';

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
  const { t, locale } = useI18n();
  const { user } = useAuth();
  const [resumo, setResumo] = useState<Resumo | null>(null);

  const fmt = (n: number) => formatMoneyShort(locale, n);

  useEffect(() => {
    if (user?.setorAcesso !== 'MEDIUM') {
      api<Resumo>('/metricas/resumo').then(setResumo).catch(console.error);
    }
  }, [user]);

  if (user?.setorAcesso === 'MEDIUM') {
    return (
      <div>
        <h2 className="text-xl font-serif text-[var(--color-accent)] mb-4">{t('erp.dashboard.myPanel')}</h2>
        <p className="text-white/80">{t('erp.dashboard.mediumHint')}</p>
      </div>
    );
  }

  if (!resumo) {
    return <p className="text-white/60">{t('erp.dashboard.loading')}</p>;
  }

  const { financeiro: fin, operacional: op } = resumo;

  return (
    <div className="space-y-8 w-full min-w-0 max-w-full">
      <div>
        <h2 className="text-xl font-serif text-[var(--color-accent)]">{t('erp.dashboard.title')}</h2>
        <p className="text-sm text-white/60 mt-1">
          {user?.setorAcesso === 'FINANCEIRO'
            ? t('erp.dashboard.subtitleTreasury')
            : t('erp.dashboard.subtitleBoard')}
        </p>
      </div>

      <Legenda />

      <section>
        <h3 className="text-lg font-serif text-[var(--color-accent)] mb-3">{t('erp.dashboard.finance')}</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <KpiCard
            label={t('erp.dashboard.kpi.revenue')}
            value={fmt(fin.receitasConcluidas)}
            hint={t('erp.dashboard.hint.revenue')}
          />
          <KpiCard
            label={t('erp.dashboard.kpi.expense')}
            value={fmt(fin.despesasConcluidas)}
            hint={t('erp.dashboard.hint.expense')}
          />
          <KpiCard label={t('erp.dashboard.kpi.balance')} value={fmt(fin.saldo)} hint={t('erp.dashboard.hint.balance')} />
          <KpiCard
            label={t('erp.dashboard.kpi.pending')}
            value={fin.transacoesPendentes}
            hint={t('erp.dashboard.hint.pending')}
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
            hint={t('erp.dashboard.hint.attendance')}
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
          <h3 className="text-lg font-serif text-[var(--color-accent)] mb-3">{t('erp.dashboard.chart.revenueByCat')}</h3>
          <div className="chart-panel bg-[var(--color-surface)] p-3 sm:p-4 rounded-xl h-64 sm:h-72">
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
          </div>
        </div>
        <div className="min-w-0">
          <h3 className="text-lg font-serif text-[var(--color-accent)] mb-3">{t('erp.dashboard.chart.expenseByCat')}</h3>
          <div className="chart-panel bg-[var(--color-surface)] p-3 sm:p-4 rounded-xl h-64 sm:h-72">
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
          </div>
        </div>
      </section>
    </div>
  );
}
