import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { PublicLayout } from '../../components/public/PublicLayout';
import { SafeImage } from '../../components/public/SafeImage';
import { api } from '../../lib/api';
import { useI18n } from '../../i18n/I18nContext';

type Tipo = 'FOTO' | 'VIDEO';

interface MidiaCard {
  id: number;
  tipo: Tipo;
  slug: string;
  titulo: string;
  descricao: string | null;
  imagemUrl: string | null;
  videoUrl: string | null;
}

export default function PublicGaleria() {
  const { t } = useI18n();
  const [itens, setItens] = useState<MidiaCard[]>([]);
  const [filtro, setFiltro] = useState<Tipo | 'TODOS'>('TODOS');
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => {
    setLoading(true);
    api<MidiaCard[]>('/public/galeria')
      .then(setItens)
      .catch(() => setErro(t('gallery.loadError')))
      .finally(() => setLoading(false));
  }, [t]);

  const filtrados = useMemo(
    () => (filtro === 'TODOS' ? itens : itens.filter((i) => i.tipo === filtro)),
    [itens, filtro]
  );

  return (
    <PublicLayout>
      <section className="max-w-3xl mx-auto px-4 pt-14 pb-8 text-center">
        <p className="text-xs uppercase tracking-[0.25em] text-primary/90">{t('gallery.eyebrow')}</p>
        <h1 className="mt-3 font-serif text-3xl sm:text-4xl text-primary">{t('gallery.title')}</h1>
        <p className="mt-4 text-foreground/85 leading-relaxed max-w-xl mx-auto">{t('gallery.subtitle')}</p>
      </section>

      <section className="max-w-3xl mx-auto px-4 pb-16">
        <div className="flex flex-wrap gap-2 justify-center mb-8">
          {(
            [
              ['TODOS', 'gallery.filterAll'],
              ['FOTO', 'gallery.filterPhoto'],
              ['VIDEO', 'gallery.filterVideo'],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setFiltro(key)}
              className={`min-h-10 px-4 rounded-xl text-sm ${
                filtro === key
                  ? 'bg-primary text-primary-foreground'
                  : 'border border-border text-foreground/80 hover:bg-card'
              }`}
            >
              {t(label)}
            </button>
          ))}
        </div>

        {loading && <p className="text-center text-foreground/60">{t('gallery.loading')}</p>}
        {erro && <p className="text-center text-destructive text-sm">{erro}</p>}
        {!loading && !erro && filtrados.length === 0 && (
          <p className="text-center text-foreground/60">{t('gallery.empty')}</p>
        )}

        <ul className="grid gap-4 sm:grid-cols-2">
          {filtrados.map((m) => (
            <li key={m.id}>
              <Link
                to={`/public/galeria/${m.slug}`}
                className="block rounded-2xl overflow-hidden border border-border/50 bg-card/40 hover:border-primary/40 transition-colors"
              >
                <div className="aspect-video bg-black/20 relative">
                  {m.imagemUrl ? (
                    <SafeImage
                      src={m.imagemUrl}
                      alt=""
                      width={640}
                      height={360}
                      className="w-full h-full object-cover"
                      fallbackLabel={m.titulo}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-foreground/40 text-sm">
                      {m.tipo === 'VIDEO' ? t('gallery.typeVideo') : t('gallery.typePhoto')}
                    </div>
                  )}
                  {m.tipo === 'VIDEO' && (
                    <span className="absolute bottom-2 right-2 text-[10px] uppercase tracking-wider bg-black/70 text-white px-2 py-0.5 rounded">
                      {t('gallery.typeVideo')}
                    </span>
                  )}
                </div>
                <div className="p-3 text-left">
                  <h2 className="font-serif text-lg text-primary line-clamp-2">{m.titulo}</h2>
                  {m.descricao && (
                    <p className="mt-1 text-sm text-foreground/70 line-clamp-2">{m.descricao}</p>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </PublicLayout>
  );
}
