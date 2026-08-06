import { useCallback, useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { useI18n } from '../../i18n/I18nContext';

interface DreResponse {
  periodo: { ano: number; mes: number };
  totais: {
    receitasOrc: number;
    receitasReal: number;
    despesasOrc: number;
    despesasReal: number;
    resultado: number;
  };
  linhas: {
    categoria: string;
    tipo: string;
    orcado: number;
    realizado: number;
    variacao: number;
    centroNome: string | null;
  }[];
}

export default function FinanceiroDrePage() {
  const { t } = useI18n();
  const now = new Date();
  const [mes, setMes] = useState(now.getMonth() + 1);
  const [ano, setAno] = useState(now.getFullYear());
  const [data, setData] = useState<DreResponse | null>(null);
  const [orcForm, setOrcForm] = useState({
    tipo: 'RECEITA',
    categoria: 'MENSALIDADE',
    valorPlanejado: '',
  });

  const load = useCallback(async () => {
    setData(await api<DreResponse>(`/financeiro/dre?ano=${ano}&mes=${mes}`));
  }, [ano, mes]);

  useEffect(() => {
    load().catch(console.error);
  }, [load]);

  const salvarOrc = async (e: React.FormEvent) => {
    e.preventDefault();
    await api('/financeiro/orcamentos', {
      method: 'POST',
      body: JSON.stringify({
        ano,
        mes,
        tipo: orcForm.tipo,
        categoria: orcForm.categoria,
        valorPlanejado: Number(orcForm.valorPlanejado),
      }),
    });
    await load();
  };

  const fmt = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div className="space-y-6">
      <p className="text-sm text-white/70">{t('erp.financeiro.dre.hint')}</p>
      <div className="flex gap-2">
        <input
          type="number"
          min={1}
          max={12}
          value={mes}
          onChange={(e) => setMes(Number(e.target.value))}
          className="w-20 px-3 py-2 rounded bg-white/5 border border-white/10"
        />
        <input
          type="number"
          value={ano}
          onChange={(e) => setAno(Number(e.target.value))}
          className="w-28 px-3 py-2 rounded bg-white/5 border border-white/10"
        />
      </div>

      {data && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-4 rounded-lg bg-white/5 border border-white/10">
            <p className="text-xs text-white/50">{t('erp.financeiro.dre.income')}</p>
            <p className="text-lg text-green-400">{fmt(data.totais.receitasReal)}</p>
            <p className="text-xs text-white/40">orc {fmt(data.totais.receitasOrc)}</p>
          </div>
          <div className="p-4 rounded-lg bg-white/5 border border-white/10">
            <p className="text-xs text-white/50">{t('erp.financeiro.dre.expense')}</p>
            <p className="text-lg text-red-300">{fmt(data.totais.despesasReal)}</p>
            <p className="text-xs text-white/40">orc {fmt(data.totais.despesasOrc)}</p>
          </div>
          <div className="p-4 rounded-lg bg-white/5 border border-white/10">
            <p className="text-xs text-white/50">{t('erp.financeiro.dre.result')}</p>
            <p className="text-lg text-[var(--color-accent)]">{fmt(data.totais.resultado)}</p>
          </div>
        </div>
      )}

      <form onSubmit={salvarOrc} className="flex flex-wrap gap-2 items-end">
        <select
          value={orcForm.tipo}
          onChange={(e) => setOrcForm({ ...orcForm, tipo: e.target.value })}
          className="px-3 py-2 rounded bg-white/5 border border-white/10"
        >
          <option value="RECEITA">RECEITA</option>
          <option value="DESPESA">DESPESA</option>
        </select>
        <input
          value={orcForm.categoria}
          onChange={(e) => setOrcForm({ ...orcForm, categoria: e.target.value })}
          className="px-3 py-2 rounded bg-white/5 border border-white/10"
        />
        <input
          type="number"
          step="0.01"
          value={orcForm.valorPlanejado}
          onChange={(e) => setOrcForm({ ...orcForm, valorPlanejado: e.target.value })}
          required
          className="w-32 px-3 py-2 rounded bg-white/5 border border-white/10"
        />
        <button type="submit" className="px-3 py-2 rounded bg-white/10 text-sm">
          {t('erp.financeiro.dre.saveBudget')}
        </button>
      </form>

      <ul className="text-sm space-y-1">
        {data?.linhas.map((l, idx) => (
          <li key={idx} className="flex justify-between border-b border-white/5 py-2">
            <span>
              {l.tipo} {l.categoria} {l.centroNome ? `(${l.centroNome})` : ''}
            </span>
            <span>
              {fmt(l.realizado)} / orc {fmt(l.orcado)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
