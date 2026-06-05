import { useEffect, useState } from 'react';
import { api } from '../lib/api';

interface Produto {
  id: number;
  nome: string;
  tipo: string;
  preco: string;
  estoqueAtual: number;
}

export default function LivrariaPage() {
  const [produtos, setProdutos] = useState<Produto[]>([]);

  useEffect(() => {
    api<Produto[]>('/livraria/produtos').then(setProdutos).catch(console.error);
  }, []);

  return (
    <div>
      <h2 className="text-xl font-serif text-[var(--color-accent)] mb-4">Livraria — PDV</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {produtos.map((p) => (
          <div key={p.id} className="bg-[var(--color-surface)] p-4 rounded-xl">
            <h3 className="font-medium">{p.nome}</h3>
            <p className="text-sm text-white/60">{p.tipo}</p>
            <p className="text-[var(--color-accent)] mt-2">R$ {Number(p.preco).toFixed(2)}</p>
            <p className="text-xs text-white/50">Estoque: {p.estoqueAtual}</p>
          </div>
        ))}
      </div>
      {produtos.length === 0 && <p className="text-white/60">Nenhum produto cadastrado.</p>}
    </div>
  );
}
