import { useState } from 'react';
import { api } from '../lib/api';

export default function RecepcaoPage() {
  const [telefone, setTelefone] = useState('');
  const [pessoas, setPessoas] = useState<{ id: number; nomeCompleto: string; telefone: string | null }[]>([]);

  const buscar = async () => {
    const data = await api<typeof pessoas>(`/pessoas?telefone=${encodeURIComponent(telefone)}`);
    setPessoas(data);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-serif text-[var(--color-accent)]">Recepção — Check-in</h2>
      <div className="flex gap-2 flex-wrap">
        <input
          value={telefone}
          onChange={(e) => setTelefone(e.target.value)}
          placeholder="Buscar por telefone"
          className="px-3 py-2 rounded bg-black/30 border border-white/20 flex-1 min-w-[200px]"
        />
        <button onClick={buscar} className="px-4 py-2 bg-[var(--color-accent)] text-black rounded">
          Buscar
        </button>
      </div>
      <ul className="space-y-2">
        {pessoas.map((p) => (
          <li key={p.id} className="bg-[var(--color-surface)] p-3 rounded flex justify-between items-center">
            <span>{p.nomeCompleto}</span>
            <span className="text-white/60 text-sm">{p.telefone}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
