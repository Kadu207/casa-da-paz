import { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api';
import { useI18n } from '../i18n/I18nContext';
import { labelEnum } from '../i18n/helpers';

interface Agendamento {
  id: number;
  nome: string;
  telefone: string;
  dataPreferida: string | null;
  observacao: string | null;
  status: string;
  createdAt: string;
  pessoa?: { id: number; nomeCompleto: string; telefone: string | null } | null;
}

export default function AgendamentosFila() {
  const { t, dateLocale } = useI18n();
  const [fila, setFila] = useState<Agendamento[]>([]);
  const [erro, setErro] = useState('');
  const [msg, setMsg] = useState('');

  const carregar = useCallback(async () => {
    const data = await api<Agendamento[]>('/agendamentos?status=PENDENTE');
    setFila(data);
  }, []);

  useEffect(() => {
    carregar().catch(console.error);
  }, [carregar]);

  const confirmar = async (id: number) => {
    setErro('');
    setMsg('');
    try {
      const res = await api<{ pessoa?: { nomeCompleto: string }; n8n?: { enviado: boolean } }>(
        `/agendamentos/${id}/confirmar`,
        { method: 'PATCH', body: JSON.stringify({ criarPessoa: true }) }
      );
      setMsg(t('erp.agendamentos.confirmed', { name: res.pessoa?.nomeCompleto ?? 'OK' }));
      await carregar();
    } catch (err) {
      setErro(err instanceof Error ? err.message : t('erp.agendamentos.confirmError'));
    }
  };

  const cancelar = async (id: number) => {
    const motivo = prompt(t('erp.agendamentos.cancelPrompt'));
    if (motivo === null) return;
    setErro('');
    try {
      await api(`/agendamentos/${id}/cancelar`, {
        method: 'PATCH',
        body: JSON.stringify({ motivo: motivo || undefined }),
      });
      await carregar();
    } catch (err) {
      setErro(err instanceof Error ? err.message : t('erp.agendamentos.cancelError'));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">{t('erp.agendamentos.queue', { count: fila.length })}</h3>
        <button onClick={() => carregar()} className="text-sm text-white/60 hover:text-white">
          {t('erp.agendamentos.refresh')}
        </button>
      </div>
      {erro && <p className="text-[var(--color-danger)] text-sm">{erro}</p>}
      {msg && <p className="text-[var(--color-success)] text-sm">{msg}</p>}
      <ul className="space-y-3">
        {fila.map((a) => (
          <li key={a.id} className="bg-[var(--color-surface)] p-4 rounded-xl space-y-2">
            <div className="flex flex-wrap justify-between gap-2">
              <div>
                <p className="font-medium">{a.nome}</p>
                <p className="text-sm text-white/60">{a.telefone}</p>
              </div>
              <span className="text-xs px-2 py-1 bg-amber-500/20 text-amber-300 rounded">
                {labelEnum(t, 'pedido', a.status) !== a.status ? labelEnum(t, 'pedido', a.status) : a.status}
              </span>
            </div>
            {a.dataPreferida && (
              <p className="text-sm text-white/70">
                {t('erp.agendamentos.preference', {
                  date: new Date(a.dataPreferida).toLocaleDateString(dateLocale),
                })}
              </p>
            )}
            {a.observacao && <p className="text-sm text-white/50">{a.observacao}</p>}
            <p className="text-xs text-white/40">
              {t('erp.agendamentos.requestedAt', {
                date: new Date(a.createdAt).toLocaleString(dateLocale),
              })}
            </p>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => confirmar(a.id)}
                className="px-3 py-1.5 bg-[var(--color-accent)] text-black rounded text-sm"
              >
                {t('erp.agendamentos.confirmLink')}
              </button>
              <button
                onClick={() => cancelar(a.id)}
                className="px-3 py-1.5 bg-white/10 rounded text-sm text-[var(--color-danger)]"
              >
                {t('erp.agendamentos.cancel')}
              </button>
            </div>
          </li>
        ))}
      </ul>
      {fila.length === 0 && (
        <p className="text-white/50 text-sm text-center py-6">{t('erp.agendamentos.empty')}</p>
      )}
    </div>
  );
}
