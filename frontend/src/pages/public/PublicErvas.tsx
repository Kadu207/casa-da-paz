import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { PublicLayout } from '../../components/public/PublicLayout';
import { SafeImage } from '../../components/public/SafeImage';
import {
  CLASSES_RITUAL,
  SECAO_ANCORAS,
  SEGURANCAS,
  avisosEnciclopedia,
  enciclopedia,
  filtrarErvas,
  splitReferencia,
} from '../../data/enciclopedia-ervas';
import { safeHref } from '../../lib/safe-url';
import { portalAssets } from '../../lib/portal-assets';
import { useI18n } from '../../i18n/I18nContext';
import { SECAO_LABEL, classeKey, pillClass, segurancaKey } from './erva-labels';

function chip(active: boolean) {
  return `min-h-10 px-3 rounded-xl text-sm ${
    active
      ? 'bg-primary text-primary-foreground'
      : 'border border-border text-foreground/80 hover:bg-card'
  }`;
}

function Linhas({ lines }: { lines: string[] }) {
  const blocos: Array<{ tipo: 'p'; texto: string } | { tipo: 'ul'; itens: string[] }> = [];
  for (const linha of lines) {
    if (linha.startsWith('• ')) {
      const ultimo = blocos[blocos.length - 1];
      if (ultimo?.tipo === 'ul') ultimo.itens.push(linha.slice(2));
      else blocos.push({ tipo: 'ul', itens: [linha.slice(2)] });
    } else {
      blocos.push({ tipo: 'p', texto: linha });
    }
  }
  return (
    <div className="space-y-3 text-foreground/85 leading-relaxed">
      {blocos.map((bloco, i) =>
        bloco.tipo === 'ul' ? (
          <ul key={i} className="list-disc pl-5 space-y-2">
            {bloco.itens.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        ) : (
          <p key={i}>{bloco.texto}</p>
        )
      )}
    </div>
  );
}

export default function PublicErvas() {
  const { t, locale } = useI18n();
  const [params, setParams] = useSearchParams();
  const q = params.get('q') ?? '';
  const classificacao = params.get('classe') ?? '';
  const seguranca = params.get('seg') ?? '';

  const filtradas = useMemo(
    () => filtrarErvas({ q, classificacao, seguranca }),
    [q, classificacao, seguranca]
  );

  function atualizar(chave: 'q' | 'classe' | 'seg', valor: string) {
    const next = new URLSearchParams(params);
    if (valor) next.set(chave, valor);
    else next.delete(chave);
    setParams(next, { replace: true });
  }

  const filtrosAtivos = Boolean(q || classificacao || seguranca);
  const avisos = avisosEnciclopedia();
  const secoes = enciclopedia.secoes.slice(1);

  return (
    <PublicLayout>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <SafeImage
            src={portalAssets.ervas}
            alt=""
            width={1280}
            height={640}
            loading="eager"
            className="cover-fill"
            fallbackLabel={enciclopedia.titulo}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/45 via-background/75 to-background" />
        </div>
        <div className="relative max-w-3xl mx-auto px-4 pt-14 pb-10 text-center">
          <p className="text-xs uppercase tracking-[0.25em] text-primary/90">{t('herbs.eyebrow')}</p>
          <h1 className="mt-3 font-serif text-3xl sm:text-4xl text-primary">{enciclopedia.titulo}</h1>
          <p className="mt-4 text-foreground/85 leading-relaxed">{enciclopedia.subtitulo}</p>
          <p className="mt-2 text-sm text-foreground/65">{enciclopedia.edicao}</p>
          {locale === 'en' && (
            <p className="mt-4 text-sm text-foreground/70">{t('herbs.langNote')}</p>
          )}
          <a
            href="#catalogo"
            className="mt-6 min-h-12 inline-flex items-center justify-center rounded-xl bg-primary text-primary-foreground font-medium px-6"
          >
            {t('herbs.openCatalog')}
          </a>
        </div>
      </section>

      <div className="max-w-3xl mx-auto px-4">
        <div className="rounded-2xl border border-primary/30 bg-card p-5 sm:p-6 space-y-3">
          {avisos.map((aviso) => (
            <p key={aviso} className="text-sm text-foreground/85 leading-relaxed">
              {aviso}
            </p>
          ))}
        </div>

        <nav className="mt-6 flex flex-wrap gap-2" aria-label={t('herbs.toc')}>
          {SECAO_ANCORAS.map((id) => (
            <a key={id} href={`#${id}`} className={chip(false)}>
              {t(SECAO_LABEL[id])}
            </a>
          ))}
          <a href="#catalogo" className={chip(false)}>
            {t('herbs.nav.catalog')}
          </a>
          <a href="#referencias" className={chip(false)}>
            {t('herbs.nav.refs')}
          </a>
        </nav>

        {secoes.map((secao, indice) => (
          <section
            key={secao.title}
            id={SECAO_ANCORAS[indice]}
            className="mt-12 scroll-mt-20"
            aria-labelledby={`secao-${SECAO_ANCORAS[indice]}`}
          >
            <h2 id={`secao-${SECAO_ANCORAS[indice]}`} className="font-serif text-2xl text-primary">
              {secao.title}
            </h2>
            {secao.paragraphs.length > 0 && (
              <div className="mt-4">
                <Linhas lines={secao.paragraphs} />
              </div>
            )}
            {secao.tables?.map((tabela) => {
              const [cabecalho, ...corpo] = tabela;
              if (!cabecalho) return null;
              return (
                <div key={cabecalho.join('|')} className="mt-4 overflow-x-auto rounded-2xl border border-border/60">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-card text-primary">
                      <tr>
                        {cabecalho.map((celula) => (
                          <th key={celula} className="px-3 py-2 font-medium">
                            {celula}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {corpo.map((linha) => (
                        <tr key={linha.join('|')} className="border-t border-border/50">
                          {linha.map((celula) => (
                            <td key={celula} className="px-3 py-2 text-foreground/85 align-top">
                              {celula}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })}
            {secao.items.length > 0 && (
              <ul className="mt-4 grid gap-3">
                {secao.items.map((item) => (
                  <li key={item.title} className="rounded-2xl border border-border/60 bg-card p-4 sm:p-5">
                    <h3 className="font-serif text-lg text-primary">{item.title}</h3>
                    <div className="mt-2">
                      <Linhas lines={item.paragraphs} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>

      <section id="catalogo" className="max-w-6xl mx-auto px-4 mt-14 scroll-mt-20 pb-8">
        <div className="max-w-3xl">
          <h2 className="font-serif text-2xl text-primary">{t('herbs.nav.catalog')}</h2>
          <p className="mt-3 text-foreground/80 leading-relaxed">{enciclopedia.catalogoIntro}</p>
        </div>

        <div className="mt-6 rounded-2xl border border-border/60 bg-card p-4 sm:p-5 space-y-4">
          <label className="block">
            <span className="text-sm text-foreground/80">{t('herbs.searchLabel')}</span>
            <input
              value={q}
              onChange={(event) => atualizar('q', event.target.value)}
              placeholder={t('herbs.searchPlaceholder')}
              className="mt-1 w-full min-h-11 rounded-xl border border-border bg-background px-3 text-foreground"
            />
          </label>

          <fieldset>
            <legend className="text-sm text-foreground/80">{t('herbs.filterClass')}</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              <button type="button" className={chip(classificacao === '')} onClick={() => atualizar('classe', '')}>
                {t('herbs.filterAll')}
              </button>
              {CLASSES_RITUAL.map((classe) => (
                <button
                  key={classe}
                  type="button"
                  className={chip(classificacao === classe)}
                  onClick={() => atualizar('classe', classificacao === classe ? '' : classe)}
                >
                  {t(classeKey(classe)!)}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="text-sm text-foreground/80">{t('herbs.filterSafety')}</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              <button type="button" className={chip(seguranca === '')} onClick={() => atualizar('seg', '')}>
                {t('herbs.filterAll')}
              </button>
              {SEGURANCAS.map((item) => (
                <button
                  key={item}
                  type="button"
                  className={chip(seguranca === item)}
                  onClick={() => atualizar('seg', seguranca === item ? '' : item)}
                >
                  {t(segurancaKey(item))}
                </button>
              ))}
            </div>
          </fieldset>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-foreground/70">{t('herbs.count', { count: filtradas.length })}</p>
            {filtrosAtivos && (
              <button
                type="button"
                className="text-sm text-primary hover:underline min-h-10"
                onClick={() => setParams({}, { replace: true })}
              >
                {t('herbs.clear')}
              </button>
            )}
          </div>
        </div>

        {filtradas.length === 0 && (
          <p className="mt-8 text-center text-foreground/70">{t('herbs.empty')}</p>
        )}

        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtradas.map((erva) => (
            <li key={erva.slug}>
              <Link
                to={`/public/ervas/${erva.slug}`}
                className="flex h-full flex-col rounded-2xl border border-border/60 bg-card overflow-hidden shadow hover:border-primary/40 transition-colors"
              >
                <SafeImage
                  src={erva.imagem}
                  alt=""
                  width={960}
                  height={720}
                  className={`w-full h-44 bg-background/40 ${
                    erva.credito?.tipo === 'fotografia' ? 'object-cover' : 'object-contain'
                  }`}
                  fallbackLabel={erva.nome}
                />
                <div className="p-4 flex flex-col flex-1">
                  <p className="text-xs uppercase tracking-wider text-primary/70">
                    {String(erva.numero).padStart(3, '0')}
                    {classeKey(erva.classificacao) ? ` · ${t(classeKey(erva.classificacao)!)}` : ''}
                  </p>
                  <h3 className="mt-1 font-serif text-xl text-primary">{erva.nome}</h3>
                  <p className="mt-1 text-sm italic text-foreground/70">
                    {erva.campos['Identificação botânica de referência']}
                  </p>
                  <p className="mt-2 text-sm text-foreground/75 leading-relaxed line-clamp-2">
                    {erva.campos['Associação simbólica (não universal)']}
                  </p>
                  {erva.credito?.tipo === 'fotografia' && (
                    <p className="mt-2 text-xs text-foreground/55 leading-snug line-clamp-2">
                      {t('herbs.photoBy', { author: erva.credito.autor })} · {erva.credito.licenca}
                    </p>
                  )}
                  <span className={`mt-3 inline-flex w-fit rounded-full px-3 py-1 text-xs ${pillClass(erva.seguranca)}`}>
                    {t(segurancaKey(erva.seguranca))}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section id="referencias" className="max-w-3xl mx-auto px-4 mt-14 scroll-mt-20 pb-16">
        <h2 className="font-serif text-2xl text-primary">{t('herbs.nav.refs')}</h2>
        <ul className="mt-4 space-y-3">
          {enciclopedia.referencias.map((linha) => {
            const ref = splitReferencia(linha);
            const href = safeHref(ref.href);
            return (
              <li key={linha} className="text-sm text-foreground/85 leading-relaxed">
                {href ? (
                  <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    {ref.rotulo}
                  </a>
                ) : (
                  ref.rotulo
                )}
              </li>
            );
          })}
        </ul>
        <p className="mt-6 text-sm text-foreground/70 leading-relaxed">{enciclopedia.licenca}</p>
        <Link to="/public/estudos" className="mt-6 inline-flex text-sm text-primary hover:underline">
          {t('herbs.ctaStudies')}
        </Link>
      </section>
    </PublicLayout>
  );
}
