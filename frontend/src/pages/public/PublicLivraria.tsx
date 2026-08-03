import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PublicLayout } from '../../components/public/PublicLayout';
import { SafeImage } from '../../components/public/SafeImage';
import { CheckoutForm, type CheckoutFormData } from '../../components/ecommerce/CheckoutForm';
import { publicApi } from '../../lib/public-api';
import { portalAssets } from '../../lib/portal-assets';
import { useI18n } from '../../i18n/I18nContext';

interface Produto {
  id: number;
  nome: string;
  tipo: string;
  preco: string;
  estoqueAtual: number;
  descricaoEcommerce: string | null;
}

interface ConteudoPublico {
  id: number;
  tipo: 'NOVIDADE' | 'DICA';
  titulo: string;
  texto: string;
  produto?: { id: number; nome: string; preco: string } | null;
}

export default function PublicLivraria() {
  const { t } = useI18n();
  const [searchParams] = useSearchParams();
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [conteudos, setConteudos] = useState<ConteudoPublico[]>([]);
  const [loading, setLoading] = useState(true);
  const [comprando, setComprando] = useState<Produto | null>(null);
  const [quantidade, setQuantidade] = useState(1);
  const [sucesso, setSucesso] = useState<{ protocolo: string; invoiceUrl?: string | null; mensagem?: string } | null>(null);

  useEffect(() => {
    Promise.all([
      publicApi<Produto[]>('/public/livraria/produtos'),
      publicApi<ConteudoPublico[]>('/public/livraria/conteudos'),
    ])
      .then(([p, c]) => {
        setProdutos(p);
        setConteudos(c);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const finalizar = async (cliente: CheckoutFormData) => {
    if (!comprando) return;
    const res = await publicApi<{
      pedido: { protocolo: string };
      pagamento: { mensagem: string; checkoutUrl: string | null; invoiceUrl?: string | null };
    }>('/public/livraria/pedidos', {
      method: 'POST',
      body: JSON.stringify({
        cliente: {
          ...cliente,
          cpf: cliente.tipo === 'PF' ? cliente.cpf : undefined,
          cnpj: cliente.tipo === 'PJ' ? cliente.cnpj : undefined,
        },
        itens: [{ produtoId: comprando.id, quantidade }],
        aceiteLgpd: true,
      }),
    });
    setComprando(null);
    setSucesso({
      protocolo: res.pedido.protocolo,
      invoiceUrl: res.pagamento.invoiceUrl ?? res.pagamento.checkoutUrl,
      mensagem: res.pagamento.mensagem,
    });
  };

  const pago = searchParams.get('pago');
  const novidades = conteudos.filter((c) => c.tipo === 'NOVIDADE');
  const dicas = conteudos.filter((c) => c.tipo === 'DICA');

  const scrollToProduto = (id: number) => {
    document.getElementById(`produto-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  return (
    <PublicLayout>
      <section className="relative overflow-hidden border-b border-border/40">
        <div className="absolute inset-0">
          <SafeImage
            src={portalAssets.ervas}
            alt=""
            width={1280}
            height={720}
            className="cover-fill opacity-40"
            fallbackLabel="Livraria"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/80 to-background" />
        </div>
        <div className="relative max-w-3xl mx-auto px-4 py-12 sm:py-14 text-center">
          <p className="text-xs uppercase tracking-[0.2em] text-primary/80">{t('shop.eyebrow')}</p>
          <h1 className="mt-2 font-serif text-3xl sm:text-4xl text-primary">{t('shop.title')}</h1>
          <p className="mt-3 text-foreground/80 max-w-lg mx-auto">{t('shop.subtitle')}</p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 py-10">
        {pago && (
          <p className="mb-6 rounded-xl border border-green-500/40 bg-green-500/10 px-4 py-3 text-sm text-green-200">
            {t('shop.paymentConfirmed')}
          </p>
        )}
        {sucesso && (
          <div className="mb-6 rounded-xl border border-primary/40 bg-primary/10 px-4 py-4 text-sm">
            <p className="font-medium text-primary">{t('shop.success')}</p>
            <p className="mt-1 text-foreground/85">
              {t('shop.protocol')}: <strong className="select-all">{sucesso.protocolo}</strong>
            </p>
            <p className="mt-2 text-foreground/70">{sucesso.mensagem ?? t('shop.asaasPending')}</p>
            {sucesso.invoiceUrl && (
              <a
                href={sucesso.invoiceUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-block text-primary underline underline-offset-2"
              >
                {t('shop.payNow')}
              </a>
            )}
          </div>
        )}

        {(novidades.length > 0 || dicas.length > 0) && (
          <div className="mb-10 space-y-8">
            {novidades.length > 0 && (
              <section>
                <h2 className="font-serif text-2xl text-primary mb-4">{t('shop.news.title')}</h2>
                <ul className="space-y-4">
                  {novidades.map((c) => (
                    <li key={c.id} className="rounded-2xl border border-border/60 bg-card/80 p-5">
                      <h3 className="font-medium text-primary">{c.titulo}</h3>
                      <p className="text-sm text-foreground/80 mt-2 whitespace-pre-wrap leading-relaxed">{c.texto}</p>
                      {c.produto && (
                        <button
                          type="button"
                          onClick={() => scrollToProduto(c.produto!.id)}
                          className="mt-3 text-sm text-primary underline underline-offset-2"
                        >
                          {t('shop.linkedBook')}: {c.produto.nome}
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            )}
            {dicas.length > 0 && (
              <section>
                <h2 className="font-serif text-2xl text-primary mb-4">{t('shop.tips.title')}</h2>
                <ul className="space-y-4">
                  {dicas.map((c) => (
                    <li key={c.id} className="rounded-2xl border border-primary/20 bg-card/60 p-5">
                      <h3 className="font-medium text-primary">{c.titulo}</h3>
                      <p className="text-sm text-foreground/80 mt-2 whitespace-pre-wrap leading-relaxed">{c.texto}</p>
                      {c.produto && (
                        <button
                          type="button"
                          onClick={() => scrollToProduto(c.produto!.id)}
                          className="mt-3 text-sm text-primary underline underline-offset-2"
                        >
                          {t('shop.linkedBook')}: {c.produto.nome}
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        )}

        {loading && <p className="text-foreground/60">{t('shop.loading')}</p>}
        {!loading && produtos.length === 0 && (
          <p className="text-foreground/60">{t('shop.empty')}</p>
        )}

        <ul className="grid gap-4 sm:grid-cols-2">
          {produtos.map((p) => (
            <li
              key={p.id}
              id={`produto-${p.id}`}
              className="rounded-2xl border border-border/60 bg-card p-5 shadow-lg flex flex-col"
            >
              <span className="text-xs uppercase text-primary/70">{p.tipo}</span>
              <h2 className="font-serif text-lg text-primary mt-1">{p.nome}</h2>
              {p.descricaoEcommerce && (
                <p className="text-sm text-foreground/75 mt-2 flex-1">{p.descricaoEcommerce}</p>
              )}
              <p className="text-xl text-primary font-medium mt-4">R$ {Number(p.preco).toFixed(2)}</p>
              <p className="text-xs text-foreground/50 mt-1">
                {t('shop.inStock', { count: p.estoqueAtual })}
              </p>
              <button
                type="button"
                onClick={() => {
                  setQuantidade(1);
                  setComprando(p);
                }}
                className="mt-4 min-h-11 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
              >
                {t('shop.buy')}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {comprando && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 p-0 sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="checkout-title"
        >
          <div className="w-full sm:max-w-lg max-h-[95dvh] overflow-hidden rounded-t-2xl sm:rounded-2xl bg-[var(--color-surface)] border border-white/10 shadow-2xl flex flex-col">
            <div className="flex items-start justify-between gap-2 p-4 border-b border-white/10 shrink-0">
              <div>
                <h2 id="checkout-title" className="font-serif text-lg text-[var(--color-accent)]">
                  {t('shop.checkout')}
                </h2>
                <p className="text-sm text-white/70 mt-0.5">
                  {comprando.nome} — R$ {Number(comprando.preco).toFixed(2)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setComprando(null)}
                className="min-h-10 min-w-10 rounded-lg hover:bg-white/10"
                aria-label={t('shop.close')}
              >
                ✕
              </button>
            </div>
            <div className="p-4 overflow-y-auto">
              <label className="block text-sm mb-2 text-white/80">
                {t('shop.quantity')}
                <input
                  type="number"
                  min={1}
                  max={comprando.estoqueAtual}
                  value={quantidade}
                  onChange={(e) => setQuantidade(Number(e.target.value))}
                  className="mt-1 w-full px-3 py-2 rounded-lg bg-black/30 border border-white/20"
                />
              </label>
              <CheckoutForm onSubmit={finalizar} submitLabel={t('shop.submitOrder')} />
            </div>
          </div>
        </div>
      )}
    </PublicLayout>
  );
}
