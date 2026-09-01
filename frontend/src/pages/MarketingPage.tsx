import { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api';
import { useI18n } from '../i18n/I18nContext';
import { hasPermission, useAuth } from '../context/AuthContext';

interface Evento {
  id: number;
  nomeEvento: string;
  dataEvento: string;
  status: string;
  tipo?: string;
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

type CategoriaEstudo = 'ERVAS' | 'BANHOS' | 'DEFUMACAO' | 'OUTROS';

interface MaterialEstudo {
  id: number;
  slug: string;
  categoria: CategoriaEstudo;
  titulo: string;
  resumo: string;
  corpo: string;
  imagemUrl: string | null;
  ordem: number;
  publicado: boolean;
}

const CATEGORIAS: CategoriaEstudo[] = ['ERVAS', 'BANHOS', 'DEFUMACAO', 'OUTROS'];

const emptyMaterial = {
  categoria: 'ERVAS' as CategoriaEstudo,
  titulo: '',
  resumo: '',
  corpo: '',
  imagemUrl: '',
  ordem: '0',
  publicado: false,
};

export default function MarketingPage() {
  const { t } = useI18n();
  const { user } = useAuth();
  const canWrite = hasPermission(user, 'marketing', 'write');
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [conteudos, setConteudos] = useState<Conteudo[]>([]);
  const [materiais, setMateriais] = useState<MaterialEstudo[]>([]);
  const [resumo, setResumo] = useState<{
    eventosAbertos: number;
    produtosPublicados: number;
    conteudosPublicados: number;
    materiaisEstudoPublicados?: number;
  } | null>(null);
  const [nomeEvento, setNomeEvento] = useState('');
  const [dataEvento, setDataEvento] = useState('');
  const [tipoEvento, setTipoEvento] = useState<'GIRA' | 'OFICINA'>('GIRA');
  const [materialForm, setMaterialForm] = useState(emptyMaterial);
  const [editMaterialId, setEditMaterialId] = useState<number | null>(null);
  const [materialErro, setMaterialErro] = useState('');

  const load = useCallback(async () => {
    const [r, e, p, c, m] = await Promise.all([
      api<typeof resumo>('/marketing/resumo'),
      api<Evento[]>('/marketing/eventos'),
      api<Produto[]>('/marketing/produtos'),
      api<Conteudo[]>('/marketing/conteudos'),
      api<MaterialEstudo[]>('/marketing/materiais-estudo'),
    ]);
    setResumo(r);
    setEventos(e);
    setProdutos(p);
    setConteudos(c);
    setMateriais(m);
  }, []);

  useEffect(() => {
    load().catch(console.error);
  }, [load]);

  const criarEvento = async (ev: React.FormEvent) => {
    ev.preventDefault();
    await api('/marketing/eventos', {
      method: 'POST',
      body: JSON.stringify({ nomeEvento, dataEvento, tipo: tipoEvento }),
    });
    setNomeEvento('');
    setDataEvento('');
    setTipoEvento('GIRA');
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

  const salvarMaterial = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setMaterialErro('');
    const payload = {
      categoria: materialForm.categoria,
      titulo: materialForm.titulo.trim(),
      resumo: materialForm.resumo.trim(),
      corpo: materialForm.corpo.trim(),
      imagemUrl: materialForm.imagemUrl.trim() || null,
      ordem: Number(materialForm.ordem) || 0,
      publicado: materialForm.publicado,
    };
    try {
      if (editMaterialId) {
        await api(`/marketing/materiais-estudo/${editMaterialId}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
      } else {
        await api('/marketing/materiais-estudo', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }
      setMaterialForm(emptyMaterial);
      setEditMaterialId(null);
      await load();
    } catch (err) {
      setMaterialErro(err instanceof Error ? err.message : t('erp.marketing.studySaveError'));
    }
  };

  const editarMaterial = (m: MaterialEstudo) => {
    setEditMaterialId(m.id);
    setMaterialForm({
      categoria: m.categoria,
      titulo: m.titulo,
      resumo: m.resumo,
      corpo: m.corpo,
      imagemUrl: m.imagemUrl ?? '',
      ordem: String(m.ordem),
      publicado: m.publicado,
    });
  };

  const toggleMaterial = async (m: MaterialEstudo) => {
    await api(`/marketing/materiais-estudo/${m.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ publicado: !m.publicado }),
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
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
          <div className="p-4 rounded-lg bg-white/5 border border-white/10">
            <p className="text-xs text-white/50">{t('erp.marketing.kpi.studies')}</p>
            <p className="text-2xl text-[var(--color-accent)]">{resumo.materiaisEstudoPublicados ?? 0}</p>
          </div>
        </div>
      )}

      <section className="space-y-3">
        <h3 className="text-lg text-white/90">{t('erp.marketing.studies')}</h3>
        <p className="text-xs text-white/50">{t('erp.marketing.studiesHint')}</p>
        {canWrite && (
        <form onSubmit={salvarMaterial} className="space-y-2 p-4 rounded-xl bg-white/5 border border-white/10">
          {materialErro && <p className="text-sm text-[var(--color-danger)]">{materialErro}</p>}
          <div className="grid gap-2 sm:grid-cols-2">
            <select
              value={materialForm.categoria}
              onChange={(e) =>
                setMaterialForm({ ...materialForm, categoria: e.target.value as CategoriaEstudo })
              }
              className="px-3 py-2 rounded bg-black/30 border border-white/20 text-sm"
            >
              {CATEGORIAS.map((c) => (
                <option key={c} value={c}>
                  {t(`studies.cat.${c}` as 'studies.cat.ERVAS')}
                </option>
              ))}
            </select>
            <input
              type="number"
              min={0}
              value={materialForm.ordem}
              onChange={(e) => setMaterialForm({ ...materialForm, ordem: e.target.value })}
              placeholder={t('erp.marketing.studyOrder')}
              className="px-3 py-2 rounded bg-black/30 border border-white/20 text-sm"
            />
          </div>
          <input
            required
            value={materialForm.titulo}
            onChange={(e) => setMaterialForm({ ...materialForm, titulo: e.target.value })}
            placeholder={t('erp.marketing.studyTitle')}
            className="w-full px-3 py-2 rounded bg-black/30 border border-white/20 text-sm"
          />
          <input
            required
            value={materialForm.resumo}
            onChange={(e) => setMaterialForm({ ...materialForm, resumo: e.target.value })}
            placeholder={t('erp.marketing.studySummary')}
            className="w-full px-3 py-2 rounded bg-black/30 border border-white/20 text-sm"
          />
          <textarea
            required
            rows={6}
            value={materialForm.corpo}
            onChange={(e) => setMaterialForm({ ...materialForm, corpo: e.target.value })}
            placeholder={t('erp.marketing.studyBody')}
            className="w-full px-3 py-2 rounded bg-black/30 border border-white/20 text-sm"
          />
          <input
            value={materialForm.imagemUrl}
            onChange={(e) => setMaterialForm({ ...materialForm, imagemUrl: e.target.value })}
            placeholder={t('erp.marketing.studyImage')}
            className="w-full px-3 py-2 rounded bg-black/30 border border-white/20 text-sm"
          />
          <label className="flex items-center gap-2 text-sm text-white/80">
            <input
              type="checkbox"
              checked={materialForm.publicado}
              onChange={(e) => setMaterialForm({ ...materialForm, publicado: e.target.checked })}
            />
            {t('erp.marketing.studyPublished')}
          </label>
          <div className="flex gap-2">
            <button type="submit" className="px-4 py-2 rounded bg-[var(--color-accent)] text-black text-sm font-medium">
              {editMaterialId ? t('erp.common.save') : t('erp.marketing.studyCreate')}
            </button>
            {editMaterialId && (
              <button
                type="button"
                onClick={() => {
                  setEditMaterialId(null);
                  setMaterialForm(emptyMaterial);
                }}
                className="px-4 py-2 rounded bg-white/10 text-sm"
              >
                {t('erp.common.cancel')}
              </button>
            )}
          </div>
        </form>
        )}
        <ul className="space-y-2 text-sm">
          {materiais.map((m) => (
            <li key={m.id} className="flex flex-wrap justify-between gap-2 items-center border-b border-white/5 py-2">
              <span>
                [{m.categoria}] {m.titulo}{' '}
                <span className="text-white/40">({m.slug})</span>
              </span>
              {canWrite && (
              <div className="flex gap-2">
                <button type="button" onClick={() => editarMaterial(m)} className="text-white/70 hover:underline">
                  {t('erp.common.edit')}
                </button>
                <button
                  type="button"
                  onClick={() => toggleMaterial(m)}
                  className="text-[var(--color-accent)] hover:underline"
                >
                  {m.publicado ? t('erp.marketing.unpublish') : t('erp.marketing.publish')}
                </button>
              </div>
              )}
            </li>
          ))}
          {materiais.length === 0 && (
            <li className="text-white/50 py-2">{t('erp.marketing.studyEmpty')}</li>
          )}
        </ul>
      </section>

      <section className="space-y-3">
        <h3 className="text-lg text-white/90">{t('erp.marketing.events')}</h3>
        {canWrite && (
        <form onSubmit={criarEvento} className="flex flex-wrap gap-2 items-end">
          <input
            value={nomeEvento}
            onChange={(e) => setNomeEvento(e.target.value)}
            placeholder={t('erp.marketing.eventName')}
            required
            className="px-3 py-2 rounded bg-white/5 border border-white/10 flex-1 min-w-[12rem]"
          />
          <select
            value={tipoEvento}
            onChange={(e) => setTipoEvento(e.target.value as 'GIRA' | 'OFICINA')}
            className="px-3 py-2 rounded bg-white/5 border border-white/10"
          >
            <option value="GIRA">{t('events.tipo.GIRA')}</option>
            <option value="OFICINA">{t('events.tipo.OFICINA')}</option>
          </select>
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
        )}
        <ul className="space-y-2 text-sm">
          {eventos.map((e) => (
            <li key={e.id} className="flex flex-wrap justify-between gap-2 items-center border-b border-white/5 py-2">
              <span>
                [{e.tipo === 'OFICINA' ? t('events.tipo.OFICINA') : t('events.tipo.GIRA')}] {e.nomeEvento}{' '}
                <span className="text-white/40">
                  ({new Date(e.dataEvento).toLocaleDateString('pt-BR')} · {e.status})
                </span>
              </span>
              {canWrite && (
              <button
                type="button"
                onClick={() => toggleEvento(e.id, e.status)}
                className="text-[var(--color-accent)] hover:underline"
              >
                {e.status === 'ABERTO' ? t('erp.marketing.unpublish') : t('erp.marketing.publish')}
              </button>
              )}
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
              {canWrite && (
              <button
                type="button"
                onClick={() => toggleProduto(p.id, p.publicadoEcommerce)}
                className="text-[var(--color-accent)] hover:underline"
              >
                {p.publicadoEcommerce ? t('erp.marketing.unpublish') : t('erp.marketing.publish')}
              </button>
              )}
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
              {canWrite && (
              <button
                type="button"
                onClick={() => toggleConteudo(c.id, c.publicado)}
                className="text-[var(--color-accent)] hover:underline"
              >
                {c.publicado ? t('erp.marketing.unpublish') : t('erp.marketing.publish')}
              </button>
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
