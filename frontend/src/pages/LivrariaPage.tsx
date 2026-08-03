import { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../i18n/I18nContext';
import { formatMoney, labelEnum } from '../i18n/helpers';

interface Produto {
  id: number;
  nome: string;
  tipo: string;
  preco: string;
  estoqueAtual: number;
  publicadoEcommerce?: boolean;
  descricaoEcommerce?: string | null;
}

interface Conteudo {
  id: number;
  tipo: 'NOVIDADE' | 'DICA';
  titulo: string;
  texto: string;
  produtoId?: number | null;
  ordem: number;
  publicado: boolean;
  produto?: { id: number; nome: string; tipo?: string } | null;
}

const TIPOS = ['LIVRO', 'ERVA', 'ARTIGO'] as const;
const emptyProduto = {
  nome: '',
  tipo: 'LIVRO' as (typeof TIPOS)[number],
  preco: '',
  estoqueAtual: '0',
  publicadoEcommerce: true,
  descricaoEcommerce: '',
};

const emptyConteudo = {
  tipo: 'NOVIDADE' as 'NOVIDADE' | 'DICA',
  titulo: '',
  texto: '',
  produtoId: '',
  ordem: '0',
  publicado: true,
};

export default function LivrariaPage() {
  const { t, locale } = useI18n();
  const { user } = useAuth();
  const canWrite =
    user?.setorAcesso === 'DIRETORIA' ||
    user?.setorAcesso === 'LIVRARIA' ||
    user?.setorAcesso === 'MARKETING';

  const [aba, setAba] = useState<'catalogo' | 'conteudos' | 'pdv'>('catalogo');
  const [filtroTipo, setFiltroTipo] = useState<string>('LIVRO');
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [conteudos, setConteudos] = useState<Conteudo[]>([]);
  const [erro, setErro] = useState('');
  const [msg, setMsg] = useState('');
  const [venda, setVenda] = useState({ produtoId: '', quantidade: '1' });
  const [entrada, setEntrada] = useState({ produtoId: '', quantidade: '1' });
  const [formProduto, setFormProduto] = useState(emptyProduto);
  const [editProdutoId, setEditProdutoId] = useState<number | null>(null);
  const [formConteudo, setFormConteudo] = useState(emptyConteudo);
  const [editConteudoId, setEditConteudoId] = useState<number | null>(null);
  const [livrosVinculo, setLivrosVinculo] = useState<Produto[]>([]);

  const carregarProdutos = useCallback(async () => {
    const q = filtroTipo ? `?tipo=${filtroTipo}` : '';
    const data = await api<Produto[]>(`/livraria/produtos${q}`);
    setProdutos(data);
  }, [filtroTipo]);

  const carregarConteudos = useCallback(async () => {
    const data = await api<Conteudo[]>('/livraria/conteudos');
    setConteudos(data);
  }, []);

  const carregar = useCallback(async () => {
    await Promise.all([carregarProdutos(), carregarConteudos()]);
  }, [carregarProdutos, carregarConteudos]);

  useEffect(() => {
    carregar().catch(console.error);
    api<Produto[]>('/livraria/produtos?tipo=LIVRO').then(setLivrosVinculo).catch(console.error);
  }, [carregar]);

  const salvarProduto = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    const payload = {
      nome: formProduto.nome,
      tipo: formProduto.tipo,
      preco: Number(formProduto.preco),
      estoqueAtual: Number(formProduto.estoqueAtual),
      publicadoEcommerce: formProduto.publicadoEcommerce,
      descricaoEcommerce: formProduto.descricaoEcommerce || undefined,
    };
    try {
      if (editProdutoId) {
        await api(`/livraria/produtos/${editProdutoId}`, { method: 'PUT', body: JSON.stringify(payload) });
        setMsg(t('erp.livraria.productUpdated'));
      } else {
        await api('/livraria/produtos', { method: 'POST', body: JSON.stringify(payload) });
        setMsg(t('erp.livraria.productCreated'));
      }
      setEditProdutoId(null);
      setFormProduto(emptyProduto);
      await carregarProdutos();
    } catch (err) {
      setErro(err instanceof Error ? err.message : t('erp.livraria.productSaveError'));
    }
  };

  const editarProduto = (p: Produto) => {
    setEditProdutoId(p.id);
    setFormProduto({
      nome: p.nome,
      tipo: p.tipo as (typeof TIPOS)[number],
      preco: String(p.preco),
      estoqueAtual: String(p.estoqueAtual),
      publicadoEcommerce: p.publicadoEcommerce !== false,
      descricaoEcommerce: p.descricaoEcommerce ?? '',
    });
    setAba('catalogo');
  };

  const excluirProduto = async (id: number, nome: string) => {
    if (!confirm(t('erp.livraria.deleteProductConfirm', { name: nome }))) return;
    setErro('');
    try {
      await api(`/livraria/produtos/${id}`, { method: 'DELETE' });
      setMsg(t('erp.livraria.productRemoved'));
      await carregar();
    } catch (err) {
      setErro(err instanceof Error ? err.message : t('erp.livraria.deleteError'));
    }
  };

  const salvarConteudo = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    const payload = {
      tipo: formConteudo.tipo,
      titulo: formConteudo.titulo,
      texto: formConteudo.texto,
      produtoId: formConteudo.produtoId ? Number(formConteudo.produtoId) : null,
      ordem: Number(formConteudo.ordem),
      publicado: formConteudo.publicado,
    };
    try {
      if (editConteudoId) {
        await api(`/livraria/conteudos/${editConteudoId}`, { method: 'PUT', body: JSON.stringify(payload) });
        setMsg(t('erp.livraria.contentUpdated'));
      } else {
        await api('/livraria/conteudos', { method: 'POST', body: JSON.stringify(payload) });
        setMsg(t('erp.livraria.contentPublished'));
      }
      setEditConteudoId(null);
      setFormConteudo(emptyConteudo);
      await carregarConteudos();
    } catch (err) {
      setErro(err instanceof Error ? err.message : t('erp.livraria.contentSaveError'));
    }
  };

  const editarConteudo = (c: Conteudo) => {
    setEditConteudoId(c.id);
    setFormConteudo({
      tipo: c.tipo,
      titulo: c.titulo,
      texto: c.texto,
      produtoId: c.produto?.id ? String(c.produto.id) : '',
      ordem: String(c.ordem),
      publicado: c.publicado,
    });
    setAba('conteudos');
  };

  const excluirConteudo = async (id: number) => {
    if (!confirm(t('erp.livraria.deleteContentConfirm'))) return;
    await api(`/livraria/conteudos/${id}`, { method: 'DELETE' });
    await carregarConteudos();
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
    setMsg(t('erp.livraria.stockEntry'));
    await carregarProdutos();
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
      setMsg(t('erp.livraria.saleDone'));
      await carregarProdutos();
    } catch (err) {
      setErro(err instanceof Error ? err.message : t('erp.livraria.saleError'));
    }
  };

  const livros = livrosVinculo;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xl font-serif text-[var(--color-accent)]">{t('erp.livraria.title')}</h2>
        <a
          href="/public/livraria"
          target="_blank"
          rel="noopener noreferrer"
          className="px-3 py-2 border border-white/20 rounded text-sm hover:bg-white/10"
        >
          {t('erp.livraria.publicShop')}
        </a>
      </div>

      <div className="flex flex-wrap gap-2">
        {(['catalogo', 'conteudos', 'pdv'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setAba(tab)}
            className={`px-4 py-2 rounded text-sm ${
              aba === tab ? 'bg-[var(--color-accent)] text-black' : 'bg-white/10'
            }`}
          >
            {tab === 'catalogo'
              ? t('erp.livraria.tabCatalog')
              : tab === 'conteudos'
                ? t('erp.livraria.tabContent')
                : t('erp.livraria.tabPos')}
          </button>
        ))}
      </div>

      {erro && <p className="text-[var(--color-danger)] text-sm">{erro}</p>}
      {msg && <p className="text-[var(--color-success)] text-sm">{msg}</p>}

      {aba === 'catalogo' && (
        <>
          {canWrite && (
            <form onSubmit={salvarProduto} className="bg-[var(--color-surface)] p-4 rounded-xl space-y-3 max-w-lg">
              <h3 className="font-medium text-[var(--color-accent)]">
                {editProdutoId ? t('erp.livraria.editItem') : t('erp.livraria.newProduct')}
              </h3>
              <input
                value={formProduto.nome}
                onChange={(e) => setFormProduto({ ...formProduto, nome: e.target.value })}
                placeholder={t('erp.livraria.titlePlaceholder')}
                className="w-full px-3 py-2 rounded bg-black/30 border border-white/20"
                required
              />
              <select
                value={formProduto.tipo}
                onChange={(e) =>
                  setFormProduto({ ...formProduto, tipo: e.target.value as (typeof TIPOS)[number] })
                }
                className="w-full px-3 py-2 rounded bg-black/30 border border-white/20"
              >
                {TIPOS.map((tipo) => (
                  <option key={tipo} value={tipo}>
                    {labelEnum(t, 'produto', tipo)}
                  </option>
                ))}
              </select>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  step="0.01"
                  value={formProduto.preco}
                  onChange={(e) => setFormProduto({ ...formProduto, preco: e.target.value })}
                  placeholder={t('erp.livraria.pricePlaceholder')}
                  className="w-full px-3 py-2 rounded bg-black/30 border border-white/20"
                  required
                />
                <input
                  type="number"
                  min="0"
                  value={formProduto.estoqueAtual}
                  onChange={(e) => setFormProduto({ ...formProduto, estoqueAtual: e.target.value })}
                  placeholder={t('erp.livraria.stockPlaceholder')}
                  className="w-full px-3 py-2 rounded bg-black/30 border border-white/20"
                />
              </div>
              <textarea
                value={formProduto.descricaoEcommerce}
                onChange={(e) => setFormProduto({ ...formProduto, descricaoEcommerce: e.target.value })}
                placeholder={t('erp.livraria.descPlaceholder')}
                rows={3}
                className="w-full px-3 py-2 rounded bg-black/30 border border-white/20 text-sm"
              />
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={formProduto.publicadoEcommerce}
                  onChange={(e) => setFormProduto({ ...formProduto, publicadoEcommerce: e.target.checked })}
                />
                {t('erp.livraria.visiblePublic')}
              </label>
              <div className="flex gap-2">
                <button type="submit" className="px-4 py-2 bg-[var(--color-accent)] text-black rounded text-sm">
                  {editProdutoId ? t('erp.livraria.saveChanges') : t('erp.livraria.register')}
                </button>
                {editProdutoId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditProdutoId(null);
                      setFormProduto(emptyProduto);
                    }}
                    className="px-4 py-2 bg-white/10 rounded text-sm"
                  >
                    {t('erp.common.cancel')}
                  </button>
                )}
              </div>
            </form>
          )}

          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-sm text-white/60">{t('erp.livraria.filter')}</span>
            {['LIVRO', 'ERVA', 'ARTIGO', ''].map((tipo) => (
              <button
                key={tipo || 'all'}
                type="button"
                onClick={() => setFiltroTipo(tipo)}
                className={`px-3 py-1 rounded text-xs ${
                  filtroTipo === tipo ? 'bg-[var(--color-accent)] text-black' : 'bg-white/10'
                }`}
              >
                {tipo ? labelEnum(t, 'produto', tipo) : t('erp.common.all')}
              </button>
            ))}
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {produtos.map((p) => (
              <div key={p.id} className="bg-[var(--color-surface)] p-4 rounded-xl flex flex-col">
                <span className="text-xs uppercase text-white/50">{labelEnum(t, 'produto', p.tipo)}</span>
                <h3 className="font-medium mt-1">{p.nome}</h3>
                {p.descricaoEcommerce && (
                  <p className="text-xs text-white/60 mt-2 line-clamp-3 flex-1">{p.descricaoEcommerce}</p>
                )}
                <p className="text-[var(--color-accent)] mt-2">{formatMoney(locale, Number(p.preco))}</p>
                <p className={`text-xs ${p.estoqueAtual <= 3 ? 'text-[var(--color-danger)]' : 'text-white/50'}`}>
                  {t('erp.livraria.stock', { count: p.estoqueAtual })}
                  {p.publicadoEcommerce === false && t('erp.livraria.hiddenShop')}
                </p>
                {canWrite && (
                  <div className="flex gap-2 mt-3">
                    <button
                      type="button"
                      onClick={() => editarProduto(p)}
                      className="text-xs px-2 py-1 rounded bg-white/10"
                    >
                      {t('erp.common.edit')}
                    </button>
                    <button
                      type="button"
                      onClick={() => excluirProduto(p.id, p.nome)}
                      className="text-xs px-2 py-1 rounded bg-white/10 text-[var(--color-danger)]"
                    >
                      {t('erp.common.delete')}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
          {produtos.length === 0 && <p className="text-white/60">{t('erp.livraria.emptyFilter')}</p>}
        </>
      )}

      {aba === 'conteudos' && (
        <>
          {canWrite && (
            <form onSubmit={salvarConteudo} className="bg-[var(--color-surface)] p-4 rounded-xl space-y-3 max-w-lg">
              <h3 className="font-medium text-[var(--color-accent)]">
                {editConteudoId ? t('erp.livraria.editContent') : t('erp.livraria.newContent')}
              </h3>
              <select
                value={formConteudo.tipo}
                onChange={(e) =>
                  setFormConteudo({ ...formConteudo, tipo: e.target.value as 'NOVIDADE' | 'DICA' })
                }
                className="w-full px-3 py-2 rounded bg-black/30 border border-white/20"
              >
                <option value="NOVIDADE">{labelEnum(t, 'conteudoOpt', 'NOVIDADE')}</option>
                <option value="DICA">{labelEnum(t, 'conteudoOpt', 'DICA')}</option>
              </select>
              <input
                value={formConteudo.titulo}
                onChange={(e) => setFormConteudo({ ...formConteudo, titulo: e.target.value })}
                placeholder={t('erp.livraria.contentTitle')}
                className="w-full px-3 py-2 rounded bg-black/30 border border-white/20"
                required
              />
              <textarea
                value={formConteudo.texto}
                onChange={(e) => setFormConteudo({ ...formConteudo, texto: e.target.value })}
                placeholder={t('erp.livraria.contentBody')}
                rows={5}
                className="w-full px-3 py-2 rounded bg-black/30 border border-white/20 text-sm"
                required
              />
              <select
                value={formConteudo.produtoId}
                onChange={(e) => setFormConteudo({ ...formConteudo, produtoId: e.target.value })}
                className="w-full px-3 py-2 rounded bg-black/30 border border-white/20"
              >
                <option value="">{t('erp.livraria.noLinkedBook')}</option>
                {livros.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nome}
                  </option>
                ))}
              </select>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  min="0"
                  value={formConteudo.ordem}
                  onChange={(e) => setFormConteudo({ ...formConteudo, ordem: e.target.value })}
                  placeholder={t('erp.livraria.orderPlaceholder')}
                  className="w-full px-3 py-2 rounded bg-black/30 border border-white/20"
                />
                <label className="flex items-center gap-2 text-sm self-center">
                  <input
                    type="checkbox"
                    checked={formConteudo.publicado}
                    onChange={(e) => setFormConteudo({ ...formConteudo, publicado: e.target.checked })}
                  />
                  {t('erp.livraria.publishedPortal')}
                </label>
              </div>
              <div className="flex gap-2">
                <button type="submit" className="px-4 py-2 bg-[var(--color-accent)] text-black rounded text-sm">
                  {editConteudoId ? t('erp.common.save') : t('erp.livraria.publish')}
                </button>
                {editConteudoId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditConteudoId(null);
                      setFormConteudo(emptyConteudo);
                    }}
                    className="px-4 py-2 bg-white/10 rounded text-sm"
                  >
                    {t('erp.common.cancel')}
                  </button>
                )}
              </div>
            </form>
          )}

          <div className="space-y-4">
            {conteudos.map((c) => (
              <article key={c.id} className="bg-[var(--color-surface)] p-4 rounded-xl">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <span className="text-xs uppercase text-[var(--color-accent)]">
                      {labelEnum(t, 'conteudo', c.tipo)}
                      {!c.publicado && t('erp.livraria.draft')}
                    </span>
                    <h3 className="font-medium mt-1">{c.titulo}</h3>
                  </div>
                  {canWrite && (
                    <div className="flex gap-2">
                      <button type="button" onClick={() => editarConteudo(c)} className="text-xs px-2 py-1 rounded bg-white/10">
                        {t('erp.common.edit')}
                      </button>
                      <button
                        type="button"
                        onClick={() => excluirConteudo(c.id)}
                        className="text-xs px-2 py-1 rounded bg-white/10 text-[var(--color-danger)]"
                      >
                        {t('erp.common.delete')}
                      </button>
                    </div>
                  )}
                </div>
                <p className="text-sm text-white/75 mt-2 whitespace-pre-wrap">{c.texto}</p>
                {c.produto && (
                  <p className="text-xs text-white/50 mt-2">
                    {t('erp.livraria.linkedBook', { name: c.produto.nome })}
                  </p>
                )}
              </article>
            ))}
            {conteudos.length === 0 && (
              <p className="text-white/60">{t('erp.livraria.emptyContent')}</p>
            )}
          </div>
        </>
      )}

      {aba === 'pdv' && canWrite && (
        <div className="grid gap-4 md:grid-cols-2 max-w-3xl">
          <form onSubmit={vender} className="bg-[var(--color-surface)] p-4 rounded-xl space-y-3">
            <h3 className="font-medium">{t('erp.livraria.posSale')}</h3>
            <select
              value={venda.produtoId}
              onChange={(e) => setVenda({ ...venda, produtoId: e.target.value })}
              className="w-full px-3 py-2 rounded bg-black/30 border border-white/20"
              required
            >
              <option value="">{t('erp.livraria.productSelect')}</option>
              {produtos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome} — {t('erp.livraria.stock', { count: p.estoqueAtual })}
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
              {t('erp.livraria.registerSale')}
            </button>
          </form>
          <form onSubmit={registrarEntrada} className="bg-[var(--color-surface)] p-4 rounded-xl space-y-3">
            <h3 className="font-medium">{t('erp.livraria.posStock')}</h3>
            <select
              value={entrada.produtoId}
              onChange={(e) => setEntrada({ ...entrada, produtoId: e.target.value })}
              className="w-full px-3 py-2 rounded bg-black/30 border border-white/20"
              required
            >
              <option value="">{t('erp.livraria.productSelect')}</option>
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
              {t('erp.livraria.registerStock')}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
