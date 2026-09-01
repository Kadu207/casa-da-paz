import { useCallback, useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { useI18n } from '../../i18n/I18nContext';
import { safeHref } from '../../lib/safe-url';

interface Cobranca {
  id: number;
  asaasPaymentId: string;
  status: string;
  billingType: string;
  valor: string;
  vencimento: string;
  invoiceUrl: string | null;
}

interface Assinatura {
  id: number;
  valor: string;
  status: string;
  billingType: string;
  nextDueDate: string | null;
  pessoa: { id: number; nomeCompleto: string };
}

export default function FinanceiroCobrancasPage() {
  const { t } = useI18n();
  const [cobrancas, setCobrancas] = useState<Cobranca[]>([]);
  const [assinaturas, setAssinaturas] = useState<Assinatura[]>([]);
  const [config, setConfig] = useState<{ env: string; configured: boolean } | null>(null);
  const [tab, setTab] = useState<'cobrancas' | 'assinaturas'>('cobrancas');

  const load = useCallback(async () => {
    const [c, a, cfg] = await Promise.all([
      api<Cobranca[]>('/cobrancas'),
      api<Assinatura[]>('/cobrancas/assinaturas'),
      api<{ env: string; configured: boolean }>('/cobrancas/config'),
    ]);
    setCobrancas(c);
    setAssinaturas(a);
    setConfig(cfg);
  }, []);

  useEffect(() => {
    load().catch(console.error);
  }, [load]);

  const cancelar = async (id: number) => {
    if (!confirm(t('erp.financeiro.cobrancas.cancelConfirm'))) return;
    await api(`/cobrancas/assinaturas/${id}`, { method: 'DELETE' });
    await load();
  };

  return (
    <div className="space-y-4">
      {config && (
        <p className="text-sm text-white/70">
          Asaas ({config.env}):{' '}
          <span className={config.configured ? 'text-green-400' : 'text-amber-400'}>
            {config.configured ? t('erp.financeiro.cobrancas.configured') : t('erp.financeiro.cobrancas.sandbox')}
          </span>
        </p>
      )}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setTab('cobrancas')}
          className={`px-3 py-1.5 rounded text-sm ${tab === 'cobrancas' ? 'bg-[var(--color-accent)] text-black' : 'bg-white/10'}`}
        >
          {t('erp.financeiro.cobrancas.list')}
        </button>
        <button
          type="button"
          onClick={() => setTab('assinaturas')}
          className={`px-3 py-1.5 rounded text-sm ${tab === 'assinaturas' ? 'bg-[var(--color-accent)] text-black' : 'bg-white/10'}`}
        >
          {t('erp.financeiro.cobrancas.subs')}
        </button>
      </div>

      {tab === 'cobrancas' ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-white/60 border-b border-white/10">
                <th className="p-2">ID</th>
                <th className="p-2">{t('erp.financeiro.cobrancas.status')}</th>
                <th className="p-2">{t('erp.financeiro.cobrancas.tipo')}</th>
                <th className="p-2">{t('erp.financeiro.cobrancas.valor')}</th>
                <th className="p-2">{t('erp.financeiro.cobrancas.fatura')}</th>
              </tr>
            </thead>
            <tbody>
              {cobrancas.map((c) => (
                <tr key={c.id} className="border-b border-white/5">
                  <td className="p-2 font-mono text-xs">{c.asaasPaymentId}</td>
                  <td className="p-2">{c.status}</td>
                  <td className="p-2">{c.billingType}</td>
                  <td className="p-2">
                    {Number(c.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </td>
                  <td className="p-2">
                    {safeHref(c.invoiceUrl) ? (
                      <a
                        href={safeHref(c.invoiceUrl)}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[var(--color-accent)] underline"
                      >
                        {t('erp.financeiro.cobrancas.open')}
                      </a>
                    ) : (
                      '—'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-white/60 border-b border-white/10">
                <th className="p-2">{t('erp.financeiro.cobrancas.medium')}</th>
                <th className="p-2">{t('erp.financeiro.cobrancas.valor')}</th>
                <th className="p-2">{t('erp.financeiro.cobrancas.status')}</th>
                <th className="p-2" />
              </tr>
            </thead>
            <tbody>
              {assinaturas.map((a) => (
                <tr key={a.id} className="border-b border-white/5">
                  <td className="p-2">{a.pessoa.nomeCompleto}</td>
                  <td className="p-2">
                    {Number(a.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </td>
                  <td className="p-2">{a.status}</td>
                  <td className="p-2">
                    {a.status === 'ACTIVE' && (
                      <button
                        type="button"
                        onClick={() => cancelar(a.id)}
                        className="text-sm text-red-300 hover:underline"
                      >
                        {t('erp.financeiro.cobrancas.cancel')}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
