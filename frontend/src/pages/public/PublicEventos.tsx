import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';

interface Evento {
  id: number;
  nomeEvento: string;
  dataEvento: string;
  capacidadeMax: number | null;
  _count: { inscricoes: number };
}

export default function PublicEventos() {
  const [eventos, setEventos] = useState<Evento[]>([]);

  useEffect(() => {
    api<Evento[]>('/public/eventos').then(setEventos).catch(console.error);
  }, []);

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Link to="/public" className="text-sm text-white/60 hover:text-white">
        ← Voltar
      </Link>
      <h1 className="text-2xl font-serif text-[var(--color-accent)] mt-4 mb-6">Próximos eventos</h1>
      <ul className="space-y-4">
        {eventos.map((e) => (
          <li key={e.id} className="bg-[var(--color-surface)] p-4 rounded-xl">
            <h2 className="font-medium">{e.nomeEvento}</h2>
            <p className="text-sm text-white/60">
              {new Date(e.dataEvento).toLocaleDateString('pt-BR')}
              {e.capacidadeMax && ` · ${e._count.inscricoes}/${e.capacidadeMax} inscritos`}
            </p>
          </li>
        ))}
      </ul>
      {eventos.length === 0 && <p className="text-white/60">Nenhum evento aberto no momento.</p>}
    </div>
  );
}
