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

const fmt = (n: number) =>
  n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });

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
  return (
    <details className="bg-[var(--color-surface)] rounded-xl p-4 text-sm text-white/75">
      <summary className="cursor-pointer font-medium text-[var(--color-accent)]">Legenda das métricas</summary>
      <ul className="mt-3 space-y-2 list-disc pl-5">
        <li>
          <strong>Receitas / Despesas concluídas:</strong> soma de transações com status CONCLUIDO no financeiro.
        </li>
        <li>
          <strong>Saldo:</strong> receitas menos despesas concluídas (visão acumulada, não fluxo de caixa mensal).
        </li>
        <li>
          <strong>Pendentes / Atrasadas:</strong> transações PENDENTE; atrasadas = vencimento anterior a hoje (ADR-003).
        </li>
        <li>
          <strong>Pessoas:</strong> cadastros totais no CRM.
        </li>
        <li>
          <strong>Agendamentos:</strong> pedidos públicos por status (PENDENTE, CONFIRMADO, CANCELADO).
        </li>
        <li>
          <strong>Eventos abertos:</strong> giras/oficinas com status ABERTO e data futura na listagem pública.
        </li>
        <li>
          <strong>Visualizações:</strong> contador incrementado ao abrir evento no portal (listagem + detalhe).
        </li>
        <li>
          <strong>Inscrições / Newsletter:</strong> inscrições em eventos e e-mails ativos na newsletter.
        </li>
        <li>
          <strong>Presenças no mês:</strong> check-ins registrados na recepção desde o dia 1 do mês corrente.
        </li>
        <li>
          <strong>Taxa de inscrição (gráfico):</strong> inscritos ÷ capacidade máxima, quando definida.
        </li>
      </ul>
    </details>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [resumo, setResumo] = useState<Resumo | null>(null);

  useEffect(() => {
    if (user?.setorAcesso !== 'MEDIUM') {
      api<Resumo>('/metricas/resumo').then(setResumo).catch(console.error);
    }
  }, [user]);

  if (user?.setorAcesso === 'MEDIUM') {
    return (
      <div>
        <h2 className="text-xl font-serif text-[var(--color-accent)] mb-4">Meu painel</h2>
        <p className="text-white/80">Visualize suas mensalidades e presenças em Financeiro.</p>
      </div>
    );
  }

  if (!resumo) {
    return <p className="text-white/60">Carregando métricas…</p>;
  }

  const { financeiro: fin, operacional: op } = resumo;

  return (
    <div className="space-y-8 w-full min-w-0 max-w-full">
      <div>
        <h2 className="text-xl font-serif text-[var(--color-accent)]">Dashboard — Casa da Paz</h2>
        <p className="text-sm text-white/60 mt-1">
          Visão consolidada para {user?.setorAcesso === 'FINANCEIRO' ? 'tesouraria' : 'diretoria'}
        </p>
      </div>

      <Legenda />

      <section>
        <h3 className="text-lg font-serif text-[var(--color-accent)] mb-3">Financeiro</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <KpiCard label="Receitas concluídas" value={fmt(fin.receitasConcluidas)} hint="Transações RECEITA + CONCLUIDO" />
          <KpiCard label="Despesas concluídas" value={fmt(fin.despesasConcluidas)} hint="Transações DESPESA + CONCLUIDO" />
          <KpiCard
            label="Saldo"
            value={fmt(fin.saldo)}
            hint="Receitas − despesas (acumulado)"
          />
          <KpiCard label="Pendentes" value={fin.transacoesPendentes} hint="Aguardando baixa ou pagamento" />
          <KpiCard label="Atrasadas" value={fin.transacoesAtrasadas} hint="Pendentes com vencimento passado" />
        </div>
      </section>

      <section>
        <h3 className="text-lg font-serif text-[var(--color-accent)] mb-3">Operacional</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard label="Pessoas cadastradas" value={op.pessoasCadastradas} hint="Total no CRM" />
          <KpiCard label="Agend. pendentes" value={op.agendamentosPendentes} hint="Portal — aguardando confirmação" />
          <KpiCard label="Agend. confirmados" value={op.agendamentosConfirmados} hint="Confirmados pela recepção/N8N" />
          <KpiCard label="Agend. cancelados" value={op.agendamentosCancelados} hint="Cancelados ou recusados" />
          <KpiCard label="Eventos abertos" value={op.eventosAbertos} hint="Publicados no portal" />
          <KpiCard label="Visualizações (eventos)" value={op.visualizacoesEventos} hint="Soma de views no portal" />
          <KpiCard label="Inscrições (total)" value={op.inscricoesTotal} hint="Inscrições em todos os eventos" />
          <KpiCard label="Newsletter ativos" value={op.newsletterAtivos} hint="E-mails com opt-in ativo" />
          <KpiCard label="Presenças no mês" value={op.presencasNoMes} hint="Check-ins desde o 1º dia do mês" />
        </div>
      </section>

      <section>
        <h3 className="text-lg font-serif text-[var(--color-accent)] mb-3">Métricas — Eventos (top 10)</h3>
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
              <Bar dataKey="views" fill="#D4AF37" name="Visualizações" radius={4} />
              <Bar dataKey="inscritos" fill="#64748B" name="Inscritos" radius={4} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="grid gap-8 lg:grid-cols-2 min-w-0">
        <div className="min-w-0">
          <h3 className="text-lg font-serif text-[var(--color-accent)] mb-3">Receitas por categoria</h3>
          <div className="chart-panel bg-[var(--color-surface)] p-3 sm:p-4 rounded-xl h-64 sm:h-72">
            <ResponsiveContainer width="100%" height="100%" debounce={50}>
              <BarChart data={resumo.receitasPorCategoria} layout="vertical" margin={{ left: 8, right: 8 }}>
                <XAxis type="number" stroke="#94a3b8" tickFormatter={(v) => fmt(v)} tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="categoria" width={72} stroke="#94a3b8" tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: number) => fmt(v)} />
                <Bar dataKey="valor" fill="#D4AF37" radius={4} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="min-w-0">
          <h3 className="text-lg font-serif text-[var(--color-accent)] mb-3">Despesas por categoria</h3>
          <div className="chart-panel bg-[var(--color-surface)] p-3 sm:p-4 rounded-xl h-64 sm:h-72">
            <ResponsiveContainer width="100%" height="100%" debounce={50}>
              <PieChart>
                <Pie
                  data={resumo.despesasPorCategoria}
                  dataKey="valor"
                  nameKey="categoria"
                  cx="50%"
                  cy="50%"
                  outerRadius="70%"
                  label={({ categoria, valor }) => `${categoria.slice(0, 10)}`}
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
