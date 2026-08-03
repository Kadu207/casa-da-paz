import { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api';
import { useI18n } from '../i18n/I18nContext';

interface Evento {
  id: number;
  nomeEvento: string;
  dataEvento: string;
  status: string;
  capacidadeMax: number | null;
  _count: { inscricoes: number };
}

interface Produto {
  id: number;
  nome: string;
  tipo: string;
  preco: string;
  estoqueAtual: number;
  publicadoEcommerce: boolean;
  descricaoEcommerce: string | null;
}

interface Conteudo {
  id: number;
  tipo: string;
  titulo: string;
  publicado: boolean;
  produto?: { id: number; nome: string } | null;
}

export default function MarketingPage() {
  const { t } = useI18n();
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [conteudos, setConteudos] = useState<Conteudo[]>([]);
  const [resumo, setResumo] = useState<{ eventosAbertos: number; produtosPublicados: number; conteudosPublicados: number } | null>(null);
  const [nomeEvento, setNomeEvento] = useState('');
  const [dataEvento, setDataEvento] = useState('');

  const load = useCallback(async () => {
    const [r, e, p, c] = await Promise.all([
      api<typeof resumo>('/marketing/resumo'),
      api<Evento[]>('/marketing/eventos'),
      api<Produto[]>('/marketing/produtos'),
      api<Conteudo[]>('/marketing/conteudos'),
    ]);
    setResumo(r);
    setEventos(e);
    setProdutos(p);
    setConteudos(c);
  }, []);

  useEffect(() => {
    load().catch(console.error);
  }, [load]);

  const criarEvento = async (ev: React.FormEvent) => {
    ev.preventDefault();
    await api('/marketing/eventos', {
      method: 'POST',
      body: JSON.stringify({ nomeEvento, dataEvento }),
    });
    setNomeEvento('');
    setDataEvento('');
    await load();
  };

  const toggleEvento = async (id: number, status: string) => {
    await api(`/marketing/eventos/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: status === 'ABERTO' ? 'ENCERRADO' : 'ABERTO' }),
    });
    await load();
  };

  const toggleProduto = async (id: number, publicado: boolean) => {
    await api(`/marketing/produtos/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ publicadoEcommerce: !publicado }),
    });
    await load();
  };

  const toggleConteudo = async (id: number, publicado: boolean) => {
    await api(`/marketing/conteudos/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ publicado: !publicado }),
    });
    await load();
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h2 className="text-xl font-serif text-[var(--color-accent)]">{t('erp.marketing.title')}</h2>
        <p className="text-sm text-white/70 mt-1">{t('erp.marketing.subtitle')}</p>
      </div>

      {resumo && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-4 rounded-lg bg-white/5 border border-white/10">
            <p className="text-xs text-white/50">{t('erp.marketing.kpi.events')}</p>
            <p className="text-2xl text-[var(--color-accent)]">{resumo.eventosAbertos}</p>
          </div>
          <div className="p-4 rounded-lg bg-white/5 border border-white/10">
            <p className="text-xs text-white/50">{t('erp.marketing.kpi.products')}</p>
            <p className="text-2xl text-[var(--color-accent)]">{resumo.produtosPublicados}</p>
          </div>
          <div className="p-4 rounded-lg bg-white/5 border border-white/10">
            <p className="text-xs text-white/50">{t('erp.marketing.kpi.content')}</p>
            <p className="text-2xl text-[var(--color-accent)]">{resumo.conteudosPublicados}</p>
          </div>
        </div>
      )}

      <section className="space-y-3">
        <h3 className="text-lg text-white/90">{t('erp.marketing.events')}</h3>
        <form onSubmit={criarEvento} className="flex flex-wrap gap-2 items-end">
          <input
            value={nomeEvento}
            onChange={(e) => setNomeEvento(e.target.value)}
            placeholder={t('erp.marketing.eventName')}
            required
            className="px-3 py-2 rounded bg-white/5 border border-white/10 flex-1 min-w-[12rem]"
          />
          <input
            type="date"
            value={dataEvento}
            onChange={(e) => setDataEvento(e.target.value)}
            required
            className="px-3 py-2 rounded bg-white/5 border border-white/10"
          />
          <button type="submit" className="px-4 py-2 rounded bg-[var(--color-accent)] text-black text-sm font-medium">
            {t('erp.marketing.publishEvent')}
          </button>
        </form>
        <ul className="space-y-2 text-sm">
          {eventos.map((e) => (
            <li key={e.id} className="flex flex-wrap justify-between gap-2 items-center border-b border-white/5 py-2">
              <span>
                {e.nomeEvento}{' '}
                <span className="text-white/40">
                  ({new Date(e.dataEvento).toLocaleDateString('pt-BR')} · {e.status})
                </span>
              </span>
              <button
                type="button"
                onClick={() => toggleEvento(e.id, e.status)}
                className="text-[var(--color-accent)] hover:underline"
              >
                {e.status === 'ABERTO' ? t('erp.marketing.unpublish') : t('erp.marketing.publish')}
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-3">
        <h3 className="text-lg text-white/90">{t('erp.marketing.books')}</h3>
        <ul className="space-y-2 text-sm">
          {produtos.map((p) => (
            <li key={p.id} className="flex flex-wrap justify-between gap-2 items-center border-b border-white/5 py-2">
              <span>
                {p.nome}{' '}
                <span className="text-white/40">
                  ({p.tipo} · {Number(p.preco).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })})
                </span>
              </span>
              <button
                type="button"
                onClick={() => toggleProduto(p.id, p.publicadoEcommerce)}
                className="text-[var(--color-accent)] hover:underline"
              >
                {p.publicadoEcommerce ? t('erp.marketing.unpublish') : t('erp.marketing.publish')}
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-3">
        <h3 className="text-lg text-white/90">{t('erp.marketing.contents')}</h3>
        <ul className="space-y-2 text-sm">
          {conteudos.map((c) => (
            <li key={c.id} className="flex flex-wrap justify-between gap-2 items-center border-b border-white/5 py-2">
              <span>
                [{c.tipo}] {c.titulo}
              </span>
              <button
                type="button"
                onClick={() => toggleConteudo(c.id, c.publicado)}
                className="text-[var(--color-accent)] hover:underline"
              >
                {c.publicado ? t('erp.marketing.unpublish') : t('erp.marketing.publish')}
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
