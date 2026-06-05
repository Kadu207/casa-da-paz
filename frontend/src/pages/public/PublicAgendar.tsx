import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';

export default function PublicAgendar() {
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [dataPreferida, setDataPreferida] = useState('');
  const [observacao, setObservacao] = useState('');
  const [ok, setOk] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await api('/public/agendamentos', {
        method: 'POST',
        body: JSON.stringify({ nome, telefone, dataPreferida: dataPreferida || undefined, observacao }),
      });
      setOk(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao agendar');
    }
  };

  if (ok) {
    return (
      <div className="max-w-md mx-auto p-6 text-center">
        <h1 className="text-xl text-[var(--color-accent)]">Agendamento recebido!</h1>
        <p className="mt-2 text-white/80">A recepção entrará em contato em breve.</p>
        <Link to="/public" className="inline-block mt-4 text-sm text-white/60">
          Voltar ao início
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-6">
      <Link to="/public" className="text-sm text-white/60 hover:text-white">
        ← Voltar
      </Link>
      <h1 className="text-2xl font-serif text-[var(--color-accent)] mt-4 mb-6">Agendar consulta</h1>
      {error && <p className="text-[var(--color-danger)] text-sm mb-4">{error}</p>}
      <form onSubmit={submit} className="space-y-4">
        <input
          required
          placeholder="Nome completo"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          className="w-full px-3 py-2 rounded bg-black/30 border border-white/20"
        />
        <input
          required
          placeholder="Telefone (WhatsApp)"
          value={telefone}
          onChange={(e) => setTelefone(e.target.value)}
          className="w-full px-3 py-2 rounded bg-black/30 border border-white/20"
        />
        <input
          type="date"
          value={dataPreferida}
          onChange={(e) => setDataPreferida(e.target.value)}
          className="w-full px-3 py-2 rounded bg-black/30 border border-white/20"
        />
        <textarea
          placeholder="Observação (opcional)"
          value={observacao}
          onChange={(e) => setObservacao(e.target.value)}
          className="w-full px-3 py-2 rounded bg-black/30 border border-white/20"
          rows={3}
        />
        <button type="submit" className="w-full py-2 bg-[var(--color-accent)] text-black rounded font-medium">
          Enviar solicitação
        </button>
      </form>
    </div>
  );
}
