import { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api';

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
      setMsg(`Confirmado: ${res.pessoa?.nomeCompleto ?? 'OK'}`);
      await carregar();
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao confirmar');
    }
  };

  const cancelar = async (id: number) => {
    const motivo = prompt('Motivo do cancelamento (opcional):');
    if (motivo === null) return;
    setErro('');
    try {
      await api(`/agendamentos/${id}/cancelar`, {
        method: 'PATCH',
        body: JSON.stringify({ motivo: motivo || undefined }),
      });
      await carregar();
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao cancelar');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">Fila de agendamentos ({fila.length})</h3>
        <button onClick={() => carregar()} className="text-sm text-white/60 hover:text-white">
          Atualizar
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
              <span className="text-xs px-2 py-1 bg-amber-500/20 text-amber-300 rounded">{a.status}</span>
            </div>
            {a.dataPreferida && (
              <p className="text-sm text-white/70">
                Preferência: {new Date(a.dataPreferida).toLocaleDateString('pt-BR')}
              </p>
            )}
            {a.observacao && <p className="text-sm text-white/50">{a.observacao}</p>}
            <p className="text-xs text-white/40">
              Solicitado em {new Date(a.createdAt).toLocaleString('pt-BR')}
            </p>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => confirmar(a.id)}
                className="px-3 py-1.5 bg-[var(--color-accent)] text-black rounded text-sm"
              >
                Confirmar e vincular pessoa
              </button>
              <button
                onClick={() => cancelar(a.id)}
                className="px-3 py-1.5 bg-white/10 rounded text-sm text-[var(--color-danger)]"
              >
                Cancelar
              </button>
            </div>
          </li>
        ))}
      </ul>
      {fila.length === 0 && (
        <p className="text-white/50 text-sm text-center py-6">Nenhum agendamento pendente</p>
      )}
    </div>
  );
}
