import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';

const COLORS = ['#D4AF37', '#F59E0B', '#64748B', '#22C55E'];

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<{ receitas: { categoria: string; _sum: { valor: string | null } }[]; despesas: { categoria: string; _sum: { valor: string | null } }[] } | null>(null);

  useEffect(() => {
    if (user?.setorAcesso !== 'MEDIUM') {
      api<typeof data>('/financeiro/dashboard').then(setData).catch(console.error);
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

  const receitasChart =
    data?.receitas.map((r) => ({
      name: r.categoria,
      valor: Number(r._sum.valor ?? 0),
    })) ?? [];

  const despesasChart =
    data?.despesas.map((d) => ({
      name: d.categoria,
      valor: Number(d._sum.valor ?? 0),
    })) ?? [];

  return (
    <div className="space-y-8">
      <h2 className="text-xl font-serif text-[var(--color-accent)]">Fluxo de Caixa</h2>
      <div className="bg-[var(--color-surface)] p-4 rounded-xl h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={receitasChart} layout="vertical">
            <XAxis type="number" stroke="#94a3b8" />
            <YAxis type="category" dataKey="name" width={120} stroke="#94a3b8" />
            <Tooltip />
            <Bar dataKey="valor" fill="#D4AF37" radius={4} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <h2 className="text-xl font-serif text-[var(--color-accent)]">Despesas</h2>
      <div className="bg-[var(--color-surface)] p-4 rounded-xl h-72">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={despesasChart} dataKey="valor" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
              {despesasChart.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
