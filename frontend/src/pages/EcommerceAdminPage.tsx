import { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api';
import { maskCnpj, maskCpf, maskCep, maskTelefone } from '../lib/masks';
import { CheckoutForm, emptyCheckoutForm, type CheckoutFormData } from '../components/ecommerce/CheckoutForm';
import { useI18n } from '../i18n/I18nContext';
import { formatMoney, labelEnum } from '../i18n/helpers';

interface Cliente {
  id: number;
  tipo: 'PF' | 'PJ';
  nomeCompleto: string;
  cpf: string | null;
  cnpj: string | null;
  email: string;
  telefone: string | null;
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string | null;
  bairro: string;
  cidade: string;
  estado: string;
  _count?: { pedidos: number };
}

interface Pedido {
  id: number;
  protocolo: string;
  status: string;
  valorTotal: string;
  createdAt: string;
  cliente: { nomeCompleto: string; email: string };
  itens: { quantidade: number; produto: { nome: string } }[];
}

const PEDIDO_STATUS = ['PENDENTE_PAGAMENTO', 'PAGO', 'CANCELADO', 'EXPIRADO'] as const;

function clienteToForm(c: Cliente): CheckoutFormData {
  return {
    tipo: c.tipo,
    nomeCompleto: c.nomeCompleto,
    cpf: c.cpf ? maskCpf(c.cpf) : '',
    cnpj: c.cnpj ? maskCnpj(c.cnpj) : '',
    email: c.email,
    telefone: c.telefone ? maskTelefone(c.telefone) : '',
    cep: maskCep(c.cep),
    logradouro: c.logradouro,
    numero: c.numero,
    complemento: c.complemento ?? '',
    bairro: c.bairro,
    cidade: c.cidade,
    estado: c.estado,
  };
}

export default function EcommerceAdminPage() {
  const { t, locale } = useI18n();
  const [aba, setAba] = useState<'pedidos' | 'clientes'>('pedidos');
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [editando, setEditando] = useState<Cliente | null>(null);
  const [novoCliente, setNovoCliente] = useState(false);
  const [erro, setErro] = useState('');

  const carregar = useCallback(async () => {
    const [p, c] = await Promise.all([
      api<Pedido[]>('/ecommerce/pedidos'),
      api<Cliente[]>('/ecommerce/clientes'),
    ]);
    setPedidos(p);
    setClientes(c);
  }, []);

  useEffect(() => {
    carregar().catch(console.error);
  }, [carregar]);

  const salvarCliente = async (data: CheckoutFormData) => {
    setErro('');
    const body = {
      ...data,
      cpf: data.tipo === 'PF' ? data.cpf : undefined,
      cnpj: data.tipo === 'PJ' ? data.cnpj : undefined,
    };
    if (editando) {
      await api(`/ecommerce/clientes/${editando.id}`, { method: 'PUT', body: JSON.stringify(body) });
    } else {
      await api('/ecommerce/clientes', { method: 'POST', body: JSON.stringify(body) });
    }
    setEditando(null);
    setNovoCliente(false);
    await carregar();
  };

  const excluirCliente = async (id: number) => {
    if (!confirm(t('erp.ecommerce.deleteClientConfirm'))) return;
    setErro('');
    try {
      await api(`/ecommerce/clientes/${id}`, { method: 'DELETE' });
      await carregar();
    } catch (err) {
      setErro(err instanceof Error ? err.message : t('erp.ecommerce.deleteError'));
    }
  };

  const atualizarStatus = async (id: number, status: string) => {
    await api(`/ecommerce/pedidos/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    await carregar();
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-serif text-[var(--color-accent)]">{t('erp.ecommerce.title')}</h2>
      <p className="text-sm text-white/60">{t('erp.ecommerce.description')}</p>

      <div className="flex gap-2">
        {(['pedidos', 'clientes'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setAba(tab)}
            className={`px-4 py-2 rounded text-sm ${
              aba === tab ? 'bg-[var(--color-accent)] text-black' : 'bg-white/10'
            }`}
          >
            {tab === 'pedidos' ? t('erp.ecommerce.tabOrders') : t('erp.ecommerce.tabClients')}
          </button>
        ))}
      </div>

      {erro && <p className="text-[var(--color-danger)] text-sm">{erro}</p>}

      {aba === 'pedidos' && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="text-left border-b border-white/20">
                <th className="p-2">{t('erp.ecommerce.colProtocol')}</th>
                <th className="p-2">{t('erp.ecommerce.colClient')}</th>
                <th className="p-2">{t('erp.ecommerce.colTotal')}</th>
                <th className="p-2">{t('erp.common.status')}</th>
                <th className="p-2">{t('erp.ecommerce.colItems')}</th>
              </tr>
            </thead>
            <tbody>
              {pedidos.map((p) => (
                <tr key={p.id} className="border-b border-white/10">
                  <td className="p-2 font-mono text-xs">{p.protocolo}</td>
                  <td className="p-2">
                    {p.cliente.nomeCompleto}
                    <br />
                    <span className="text-white/50 text-xs">{p.cliente.email}</span>
                  </td>
                  <td className="p-2">{formatMoney(locale, Number(p.valorTotal))}</td>
                  <td className="p-2">
                    <select
                      value={p.status}
                      onChange={(e) => atualizarStatus(p.id, e.target.value)}
                      className="bg-black/30 border border-white/20 rounded px-2 py-1 text-xs"
                    >
                      {PEDIDO_STATUS.map((s) => (
                        <option key={s} value={s}>
                          {labelEnum(t, 'pedido', s)}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="p-2 text-xs text-white/70">
                    {p.itens.map((i) => `${i.quantidade}× ${i.produto.nome}`).join(', ')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {pedidos.length === 0 && (
            <p className="text-white/50 text-sm mt-4">{t('erp.ecommerce.emptyOrders')}</p>
          )}
        </div>
      )}

      {aba === 'clientes' && (
        <>
          <button
            type="button"
            onClick={() => {
              setEditando(null);
              setNovoCliente(true);
            }}
            className="px-4 py-2 bg-[var(--color-accent)] text-black rounded text-sm"
          >
            {t('erp.ecommerce.newClient')}
          </button>

          {(novoCliente || editando) && (
            <div className="bg-[var(--color-surface)] p-4 rounded-xl max-w-lg">
              <h3 className="font-medium text-[var(--color-accent)] mb-3">
                {editando ? t('erp.ecommerce.editClient') : t('erp.ecommerce.registerClient')}
              </h3>
              <CheckoutForm
                key={editando?.id ?? 'novo'}
                initial={editando ? clienteToForm(editando) : emptyCheckoutForm}
                onSubmit={salvarCliente}
                submitLabel={t('erp.ecommerce.saveClient')}
              />
              <button
                type="button"
                onClick={() => {
                  setNovoCliente(false);
                  setEditando(null);
                }}
                className="mt-2 text-sm text-white/60 hover:text-white"
              >
                {t('erp.common.cancel')}
              </button>
            </div>
          )}

          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b border-white/20">
                <th className="p-2">{t('erp.common.name')}</th>
                <th className="p-2">{t('erp.ecommerce.colDoc')}</th>
                <th className="p-2">{t('erp.common.email')}</th>
                <th className="p-2">{t('erp.ecommerce.colOrders')}</th>
                <th className="p-2">{t('erp.common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {clientes.map((c) => (
                <tr key={c.id} className="border-b border-white/10">
                  <td className="p-2">{c.nomeCompleto}</td>
                  <td className="p-2 text-xs">{c.cpf ?? c.cnpj ?? t('erp.common.emptyDash')}</td>
                  <td className="p-2">{c.email}</td>
                  <td className="p-2">{c._count?.pedidos ?? 0}</td>
                  <td className="p-2 space-x-2">
                    <button
                      type="button"
                      onClick={() => {
                        setNovoCliente(false);
                        setEditando(c);
                      }}
                      className="text-xs px-2 py-1 rounded bg-white/10"
                    >
                      {t('erp.common.edit')}
                    </button>
                    <button
                      type="button"
                      onClick={() => excluirCliente(c.id)}
                      className="text-xs px-2 py-1 rounded bg-white/10 text-[var(--color-danger)]"
                    >
                      {t('erp.common.delete')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}
