import { useCallback, useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { useI18n } from '../../i18n/I18nContext';

interface Item {
  parcelaId: number;
  contaPagarId: number;
  numero: number;
  valor: number;
  vencimento: string;
  diasParaVencer: number;
  vencido: boolean;
  descricao: string;
  categoria: string;
  fornecedor: { id: number; nome: string } | null;
}

export default function FinanceiroPagamentosPage() {
  const { t } = useI18n();
  const [items, setItems] = useState<Item[]>([]);

  const load = useCallback(async () => {
    setItems(await api<Item[]>('/financeiro/pagamentos-a-fazer?ateDias=45'));
  }, []);

  useEffect(() => {
    load().catch(console.error);
  }, [load]);

  const baixar = async (contaPagarId: number, parcelaId: number) => {
    await api(`/contas-pagar/${contaPagarId}/parcelas/${parcelaId}/baixar`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
    await load();
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-white/70">{t('erp.financeiro.pagamentos.hint')}</p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-white/60 border-b border-white/10">
              <th className="p-2">{t('erp.financeiro.pagamentos.desc')}</th>
              <th className="p-2">{t('erp.financeiro.pagamentos.fornecedor')}</th>
              <th className="p-2">{t('erp.financeiro.pagamentos.valor')}</th>
              <th className="p-2">{t('erp.financeiro.pagamentos.venc')}</th>
              <th className="p-2" />
            </tr>
          </thead>
          <tbody>
            {items.map((i) => (
              <tr key={i.parcelaId} className="border-b border-white/5">
                <td className="p-2">
                  {i.descricao}{' '}
                  <span className="text-white/40">
                    (#{i.numero} · {i.categoria})
                  </span>
                </td>
                <td className="p-2">{i.fornecedor?.nome ?? '—'}</td>
                <td className="p-2">
                  {i.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </td>
                <td className={`p-2 ${i.vencido ? 'text-red-300' : ''}`}>
                  {new Date(i.vencimento).toLocaleDateString('pt-BR')}{' '}
                  <span className="text-white/40">
                    ({i.vencido ? `${Math.abs(i.diasParaVencer)}d atraso` : `${i.diasParaVencer}d`})
                  </span>
                </td>
                <td className="p-2">
                  <button
                    type="button"
                    onClick={() => baixar(i.contaPagarId, i.parcelaId)}
                    className="text-[var(--color-accent)] hover:underline"
                  >
                    {t('erp.financeiro.pagamentos.pay')}
                  </button>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={5} className="p-4 text-white/40">
                  {t('erp.financeiro.pagamentos.empty')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
