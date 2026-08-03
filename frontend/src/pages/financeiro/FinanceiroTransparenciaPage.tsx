import { useCallback, useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { useI18n } from '../../i18n/I18nContext';

interface Transparencia {
  periodo: { de: string; ate: string };
  totais: { receitas: number; despesas: number; saldo: number };
  porCategoria: { categoria: string; receitas: number; despesas: number }[];
  porConta: { contaId: number; nome: string; tipo: string | null; receitas: number; despesas: number; saldo: number }[];
  porOrigem: { origem: string; valor: number }[];
}

export default function FinanceiroTransparenciaPage() {
  const { t } = useI18n();
  const now = new Date();
  const [mes, setMes] = useState(now.getMonth() + 1);
  const [ano, setAno] = useState(now.getFullYear());
  const [data, setData] = useState<Transparencia | null>(null);

  const load = useCallback(async () => {
    const res = await api<Transparencia>(`/financeiro/transparencia?mes=${mes}&ano=${ano}`);
    setData(res);
  }, [mes, ano]);

  useEffect(() => {
    load().catch(console.error);
  }, [load]);

  const fmt = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div className="space-y-6">
      <p className="text-sm text-white/70">{t('erp.financeiro.transparencia.hint')}</p>
      <div className="flex flex-wrap gap-2 items-end">
        <label className="text-sm">
          <span className="block text-white/60 mb-1">{t('erp.financeiro.transparencia.mes')}</span>
          <input
            type="number"
            min={1}
            max={12}
            value={mes}
            onChange={(e) => setMes(Number(e.target.value))}
            className="w-20 px-3 py-2 rounded bg-white/5 border border-white/10"
          />
        </label>
        <label className="text-sm">
          <span className="block text-white/60 mb-1">{t('erp.financeiro.transparencia.ano')}</span>
          <input
            type="number"
            value={ano}
            onChange={(e) => setAno(Number(e.target.value))}
            className="w-28 px-3 py-2 rounded bg-white/5 border border-white/10"
          />
        </label>
      </div>

      {data && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-lg bg-white/5 border border-white/10">
              <p className="text-xs text-white/50">{t('erp.financeiro.transparencia.receitas')}</p>
              <p className="text-xl text-green-400 font-medium">{fmt(data.totais.receitas)}</p>
            </div>
            <div className="p-4 rounded-lg bg-white/5 border border-white/10">
              <p className="text-xs text-white/50">{t('erp.financeiro.transparencia.despesas')}</p>
              <p className="text-xl text-red-300 font-medium">{fmt(data.totais.despesas)}</p>
            </div>
            <div className="p-4 rounded-lg bg-white/5 border border-white/10">
              <p className="text-xs text-white/50">{t('erp.financeiro.transparencia.saldo')}</p>
              <p className="text-xl text-[var(--color-accent)] font-medium">{fmt(data.totais.saldo)}</p>
            </div>
          </div>

          <section>
            <h3 className="text-sm font-medium text-white/80 mb-2">{t('erp.financeiro.transparencia.byAccount')}</h3>
            <ul className="space-y-1 text-sm">
              {data.porConta.map((c) => (
                <li key={c.contaId} className="flex justify-between gap-4 border-b border-white/5 py-2">
                  <span>
                    {c.nome} <span className="text-white/40">({c.tipo})</span>
                  </span>
                  <span>{fmt(c.saldo)}</span>
                </li>
              ))}
              {data.porConta.length === 0 && <li className="text-white/40">{t('erp.financeiro.transparencia.empty')}</li>}
            </ul>
          </section>

          <section>
            <h3 className="text-sm font-medium text-white/80 mb-2">{t('erp.financeiro.transparencia.byCategory')}</h3>
            <ul className="space-y-1 text-sm">
              {data.porCategoria.map((c) => (
                <li key={c.categoria} className="flex justify-between gap-4 border-b border-white/5 py-2">
                  <span>{c.categoria}</span>
                  <span>
                    +{fmt(c.receitas)} / -{fmt(c.despesas)}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </div>
  );
}
