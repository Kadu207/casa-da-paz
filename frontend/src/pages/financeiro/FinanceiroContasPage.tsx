import { useCallback, useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { useI18n } from '../../i18n/I18nContext';

interface Conta {
  id: number;
  nome: string;
  tipo: string;
  saldoInicial: number;
  saldoCalculado: number;
  ativa: boolean;
  asaasWalletId: string | null;
}

export default function FinanceiroContasPage() {
  const { t } = useI18n();
  const [contas, setContas] = useState<Conta[]>([]);
  const [nome, setNome] = useState('');
  const [tipo, setTipo] = useState<'CAIXA' | 'BANCO' | 'ASAAS'>('CAIXA');
  const [msg, setMsg] = useState('');

  const load = useCallback(async () => {
    const data = await api<Conta[]>('/financeiro/contas');
    setContas(data);
  }, []);

  useEffect(() => {
    load().catch(console.error);
  }, [load]);

  const criar = async (e: React.FormEvent) => {
    e.preventDefault();
    await api('/financeiro/contas', {
      method: 'POST',
      body: JSON.stringify({ nome, tipo, saldoInicial: 0 }),
    });
    setNome('');
    await load();
  };

  const syncAsaas = async () => {
    const res = await api<{ configurado: boolean; balance: number | null }>('/financeiro/contas/sync-asaas', {
      method: 'POST',
    });
    setMsg(
      res.configurado
        ? t('erp.financeiro.contas.syncOk', { balance: String(res.balance ?? 0) })
        : t('erp.financeiro.contas.syncOff')
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 items-center justify-between">
        <p className="text-sm text-white/70">{t('erp.financeiro.contas.hint')}</p>
        <button
          type="button"
          onClick={() => syncAsaas().catch((e) => setMsg(String(e)))}
          className="px-3 py-2 rounded bg-white/10 text-sm hover:bg-white/20"
        >
          {t('erp.financeiro.contas.sync')}
        </button>
      </div>
      {msg && <p className="text-sm text-[var(--color-accent)]">{msg}</p>}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-white/60 border-b border-white/10">
              <th className="p-2">{t('erp.financeiro.contas.nome')}</th>
              <th className="p-2">{t('erp.financeiro.contas.tipo')}</th>
              <th className="p-2">{t('erp.financeiro.contas.saldo')}</th>
              <th className="p-2">{t('erp.financeiro.contas.status')}</th>
            </tr>
          </thead>
          <tbody>
            {contas.map((c) => (
              <tr key={c.id} className="border-b border-white/5">
                <td className="p-2">{c.nome}</td>
                <td className="p-2">{c.tipo}</td>
                <td className="p-2">
                  {c.saldoCalculado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </td>
                <td className="p-2">{c.ativa ? 'Ativa' : 'Inativa'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <form onSubmit={criar} className="flex flex-wrap gap-2 items-end">
        <label className="text-sm">
          <span className="block text-white/60 mb-1">{t('erp.financeiro.contas.nome')}</span>
          <input
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            required
            className="px-3 py-2 rounded bg-white/5 border border-white/10"
          />
        </label>
        <label className="text-sm">
          <span className="block text-white/60 mb-1">{t('erp.financeiro.contas.tipo')}</span>
          <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value as typeof tipo)}
            className="px-3 py-2 rounded bg-white/5 border border-white/10"
          >
            <option value="CAIXA">CAIXA</option>
            <option value="BANCO">BANCO</option>
            <option value="ASAAS">ASAAS</option>
          </select>
        </label>
        <button type="submit" className="px-4 py-2 rounded bg-[var(--color-accent)] text-black text-sm font-medium">
          {t('erp.financeiro.contas.add')}
        </button>
      </form>
    </div>
  );
}
