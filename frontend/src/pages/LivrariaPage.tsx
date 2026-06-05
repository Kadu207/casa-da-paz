import { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';

interface Produto {
  id: number;
  nome: string;
  tipo: string;
  preco: string;
  estoqueAtual: number;
  publicadoEcommerce?: boolean;
  descricaoEcommerce?: string | null;
}

const TIPOS = ['LIVRO', 'ERVA', 'ARTIGO'] as const;

export default function LivrariaPage() {
  const { user } = useAuth();
  const canWrite = user?.setorAcesso === 'DIRETORIA' || user?.setorAcesso === 'LIVRARIA';

  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [erro, setErro] = useState('');
  const [msg, setMsg] = useState('');
  const [venda, setVenda] = useState({ produtoId: '', quantidade: '1' });
  const [novo, setNovo] = useState({
    nome: '',
    tipo: 'LIVRO' as (typeof TIPOS)[number],
    preco: '',
    estoqueAtual: '0',
    publicadoEcommerce: true,
    descricaoEcommerce: '',
  });
  const [entrada, setEntrada] = useState({ produtoId: '', quantidade: '1' });
  const [mostrarCadastro, setMostrarCadastro] = useState(false);

  const carregar = useCallback(async () => {
    const data = await api<Produto[]>('/livraria/produtos');
    setProdutos(data);
  }, []);

  useEffect(() => {
    carregar().catch(console.error);
  }, [carregar]);

  const registrarProduto = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    await api('/livraria/produtos', {
      method: 'POST',
      body: JSON.stringify({
        nome: novo.nome,
        tipo: novo.tipo,
        preco: Number(novo.preco),
        estoqueAtual: Number(novo.estoqueAtual),
        publicadoEcommerce: novo.publicadoEcommerce,
        descricaoEcommerce: novo.descricaoEcommerce || undefined,
      }),
    });
    setMostrarCadastro(false);
    setNovo({
      nome: '',
      tipo: 'LIVRO',
      preco: '',
      estoqueAtual: '0',
      publicadoEcommerce: true,
      descricaoEcommerce: '',
    });
    await carregar();
  };

  const registrarEntrada = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    await api('/livraria/entrada', {
      method: 'POST',
      body: JSON.stringify({
        produtoId: Number(entrada.produtoId),
        quantidade: Number(entrada.quantidade),
      }),
    });
    setMsg('Entrada registrada');
    await carregar();
  };

  const vender = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    setMsg('');
    try {
      await api('/livraria/venda', {
        method: 'POST',
        body: JSON.stringify({
          produtoId: Number(venda.produtoId),
          quantidade: Number(venda.quantidade),
        }),
      });
      setMsg('Venda concluída — estoque e financeiro atualizados');
      await carregar();
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro na venda');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xl font-serif text-[var(--color-accent)]">Livraria — PDV</h2>
        <div className="flex gap-2">
          <a
            href="/public/livraria"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-2 border border-white/20 rounded text-sm hover:bg-white/10"
          >
            Ver loja pública
          </a>
          {canWrite && (
            <button
              onClick={() => setMostrarCadastro(true)}
              className="px-4 py-2 bg-[var(--color-accent)] text-black rounded text-sm"
            >
              Novo produto
            </button>
          )}
        </div>
      </div>

      {erro && <p className="text-[var(--color-danger)] text-sm">{erro}</p>}
      {msg && <p className="text-[var(--color-success)] text-sm">{msg}</p>}

      {mostrarCadastro && canWrite && (
        <form onSubmit={registrarProduto} className="bg-[var(--color-surface)] p-4 rounded-xl space-y-3 max-w-md">
          <h3 className="font-medium text-[var(--color-accent)]">Cadastrar produto</h3>
          <input
            value={novo.nome}
            onChange={(e) => setNovo({ ...novo, nome: e.target.value })}
            placeholder="Nome"
            className="w-full px-3 py-2 rounded bg-black/30 border border-white/20"
            required
          />
          <select
            value={novo.tipo}
            onChange={(e) => setNovo({ ...novo, tipo: e.target.value as (typeof TIPOS)[number] })}
            className="w-full px-3 py-2 rounded bg-black/30 border border-white/20"
          >
            {TIPOS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <input
            type="number"
            step="0.01"
            value={novo.preco}
            onChange={(e) => setNovo({ ...novo, preco: e.target.value })}
            placeholder="Preço"
            className="w-full px-3 py-2 rounded bg-black/30 border border-white/20"
            required
          />
          <input
            type="number"
            min="0"
            value={novo.estoqueAtual}
            onChange={(e) => setNovo({ ...novo, estoqueAtual: e.target.value })}
            placeholder="Estoque inicial"
            className="w-full px-3 py-2 rounded bg-black/30 border border-white/20"
          />
          <textarea
            value={novo.descricaoEcommerce}
            onChange={(e) => setNovo({ ...novo, descricaoEcommerce: e.target.value })}
            placeholder="Descrição na loja online (opcional)"
            rows={2}
            className="w-full px-3 py-2 rounded bg-black/30 border border-white/20 text-sm"
          />
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={novo.publicadoEcommerce}
              onChange={(e) => setNovo({ ...novo, publicadoEcommerce: e.target.checked })}
            />
            Publicar na loja online
          </label>
          <button type="submit" className="px-4 py-2 bg-[var(--color-accent)] text-black rounded text-sm">
            Salvar
          </button>
        </form>
      )}

      {canWrite && (
        <form onSubmit={vender} className="bg-[var(--color-surface)] p-4 rounded-xl space-y-3 max-w-md">
          <h3 className="font-medium">PDV — Venda</h3>
          <select
            value={venda.produtoId}
            onChange={(e) => setVenda({ ...venda, produtoId: e.target.value })}
            className="w-full px-3 py-2 rounded bg-black/30 border border-white/20"
            required
          >
            <option value="">Produto</option>
            {produtos.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome} — estoque {p.estoqueAtual}
              </option>
            ))}
          </select>
          <input
            type="number"
            min="1"
            value={venda.quantidade}
            onChange={(e) => setVenda({ ...venda, quantidade: e.target.value })}
            className="w-full px-3 py-2 rounded bg-black/30 border border-white/20"
            required
          />
          <button type="submit" className="px-4 py-2 bg-[var(--color-accent)] text-black rounded text-sm">
            Registrar venda
          </button>
        </form>
      )}

      {canWrite && (
        <form onSubmit={registrarEntrada} className="bg-[var(--color-surface)] p-4 rounded-xl space-y-3 max-w-md">
          <h3 className="font-medium">Entrada de estoque</h3>
          <select
            value={entrada.produtoId}
            onChange={(e) => setEntrada({ ...entrada, produtoId: e.target.value })}
            className="w-full px-3 py-2 rounded bg-black/30 border border-white/20"
            required
          >
            <option value="">Produto</option>
            {produtos.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome}
              </option>
            ))}
          </select>
          <input
            type="number"
            min="1"
            value={entrada.quantidade}
            onChange={(e) => setEntrada({ ...entrada, quantidade: e.target.value })}
            className="w-full px-3 py-2 rounded bg-black/30 border border-white/20"
            required
          />
          <button type="submit" className="px-4 py-2 bg-white/10 rounded text-sm">
            Registrar entrada
          </button>
        </form>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {produtos.map((p) => (
          <div key={p.id} className="bg-[var(--color-surface)] p-4 rounded-xl">
            <h3 className="font-medium">{p.nome}</h3>
            <p className="text-sm text-white/60">{p.tipo}</p>
            <p className="text-[var(--color-accent)] mt-2">R$ {Number(p.preco).toFixed(2)}</p>
            <p className={`text-xs mt-1 ${p.estoqueAtual <= 3 ? 'text-[var(--color-danger)]' : 'text-white/50'}`}>
              Estoque: {p.estoqueAtual}
              {p.publicadoEcommerce === false && ' · oculto na loja'}
            </p>
          </div>
        ))}
      </div>
      {produtos.length === 0 && <p className="text-white/60">Nenhum produto cadastrado.</p>}
    </div>
  );
}
