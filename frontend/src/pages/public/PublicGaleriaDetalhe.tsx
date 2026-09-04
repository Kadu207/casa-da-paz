import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { PublicLayout } from '../../components/public/PublicLayout';
import { SafeImage } from '../../components/public/SafeImage';
import { api } from '../../lib/api';
import { parseVideoEmbed } from '../../lib/video-embed';
import { useI18n } from '../../i18n/I18nContext';

interface Midia {
  id: number;
  tipo: 'FOTO' | 'VIDEO';
  slug: string;
  titulo: string;
  descricao: string | null;
  imagemUrl: string | null;
  videoUrl: string | null;
  embedUrl?: string | null;
}

export default function PublicGaleriaDetalhe() {
  const { slug } = useParams<{ slug: string }>();
  const { t } = useI18n();
  const [item, setItem] = useState<Midia | null>(null);
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    api<Midia>(`/public/galeria/${encodeURIComponent(slug)}`)
      .then(setItem)
      .catch(() => setErro(t('gallery.notFound')))
      .finally(() => setLoading(false));
  }, [slug, t]);

  const embed =
    item?.embedUrl ?? (item?.videoUrl ? parseVideoEmbed(item.videoUrl)?.embedUrl : null);

  return (
    <PublicLayout>
      <article className="max-w-3xl mx-auto px-4 py-10">
        <Link to="/public/galeria" className="text-sm text-primary hover:underline">
          ← {t('gallery.back')}
        </Link>

        {loading && <p className="mt-8 text-foreground/60">{t('gallery.loading')}</p>}
        {erro && <p className="mt-8 text-destructive">{erro}</p>}

        {item && (
          <>
            <p className="mt-6 text-xs uppercase tracking-[0.2em] text-primary/80">
              {item.tipo === 'VIDEO' ? t('gallery.typeVideo') : t('gallery.typePhoto')}
            </p>
            <h1 className="mt-2 font-serif text-3xl sm:text-4xl text-primary">{item.titulo}</h1>
            {item.descricao && (
              <p className="mt-3 text-foreground/80 leading-relaxed">{item.descricao}</p>
            )}

            <div className="mt-6 rounded-2xl overflow-hidden border border-border/50 bg-black/30">
              {item.tipo === 'VIDEO' && embed ? (
                <div className="aspect-video">
                  <iframe
                    title={item.titulo}
                    src={embed}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="strict-origin-when-cross-origin"
                  />
                </div>
              ) : item.imagemUrl ? (
                <SafeImage
                  src={item.imagemUrl}
                  alt=""
                  width={1280}
                  height={720}
                  className="w-full max-h-[70vh] object-contain bg-black"
                  fallbackLabel={item.titulo}
                />
              ) : (
                <p className="p-8 text-center text-foreground/60">{t('gallery.noMedia')}</p>
              )}
            </div>
          </>
        )}
      </article>
    </PublicLayout>
  );
}
