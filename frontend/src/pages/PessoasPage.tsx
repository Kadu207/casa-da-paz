import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../i18n/I18nContext';
import { labelEnum } from '../i18n/helpers';
import CadastroSecaoTable from '../components/cadastros/CadastroSecaoTable';
import {
  CADASTRO_SECOES,
  type PessoaCadastro,
} from '../lib/cadastro-secoes';
import {
  PERFIS_FORM,
  perfilExigeResponsavel,
  type ResponsavelForm,
  type TipoPerfil,
} from '../types/cadastro';

interface DuplicataSugerida extends PessoaCadastro {
  motivo: 'telefone' | 'nome';
}

const emptyResponsavel = (): ResponsavelForm => ({ nomeCompleto: '', telefone: '' });

const emptyForm = {
  nomeCompleto: '',
  telefone: '',
  maiorDeIdade: true,
  tipoPerfil: 'CONSULENTE' as TipoPerfil,
  responsaveis: [] as ResponsavelForm[],
};

export default function PessoasPage() {
  const { t } = useI18n();
  const { user } = useAuth();
  const canWrite = user?.setorAcesso === 'DIRETORIA' || user?.setorAcesso === 'RECEPCAO';

  const [pessoas, setPessoas] = useState<PessoaCadastro[]>([]);
  const [busca, setBusca] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<number | null>(null);
  const [duplicatas, setDuplicatas] = useState<DuplicataSugerida[]>([]);
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [loading, setLoading] = useState(true);

  const opcoesPerfil = useMemo(() => {
    const base = [...PERFIS_FORM];
    if (editId && form.tipoPerfil === 'FUNCIONARIO' && !base.includes('FUNCIONARIO')) {
      base.push('FUNCIONARIO');
    }
    return base;
  }, [editId, form.tipoPerfil]);

  const exigeResponsavel = perfilExigeResponsavel(form.tipoPerfil, form.maiorDeIdade);

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const q = busca.trim();
      const path = q ? `/pessoas?q=${encodeURIComponent(q)}` : '/pessoas';
      const data = await api<PessoaCadastro[]>(path);
      setPessoas(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [busca]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const pessoasPorPerfil = useMemo(() => {
    const map = new Map<TipoPerfil, PessoaCadastro[]>();
    for (const secao of CADASTRO_SECOES) map.set(secao.perfil, []);
    map.set('FUNCIONARIO', []);
    for (const p of pessoas) {
      const key = map.has(p.tipoPerfil) ? p.tipoPerfil : 'FUNCIONARIO';
      map.get(key)!.push(p);
    }
    return map;
  }, [pessoas]);

  const verificarDuplicatas = useCallback(async (nome: string, telefone: string, excludeId?: number) => {
    if (!nome.trim() && !telefone.trim()) {
      setDuplicatas([]);
      return;
    }
    const params = new URLSearchParams();
    if (nome.trim()) params.set('nome', nome.trim());
    if (telefone.trim()) params.set('telefone', telefone.trim());
    if (excludeId) params.set('excludeId', String(excludeId));
    try {
      const sugestoes = await api<DuplicataSugerida[]>(`/pessoas/sugerir-duplicatas?${params}`);
      setDuplicatas(sugestoes);
    } catch {
      setDuplicatas([]);
    }
  }, []);

  useEffect(() => {
    if (!mostrarForm) return;
    const timer = setTimeout(() => {
      verificarDuplicatas(form.nomeCompleto, form.telefone, editId ?? undefined);
    }, 400);
    return () => clearTimeout(timer);
  }, [form.nomeCompleto, form.telefone, editId, mostrarForm, verificarDuplicatas]);

  useEffect(() => {
    if (!exigeResponsavel) {
      setForm((f) => (f.responsaveis.length ? { ...f, responsaveis: [] } : f));
      return;
    }
    setForm((f) =>
      f.responsaveis.length > 0 ? f : { ...f, responsaveis: [emptyResponsavel()] }
    );
  }, [exigeResponsavel]);

  const abrirNovo = (perfil: TipoPerfil) => {
    setEditId(null);
    setForm({ ...emptyForm, tipoPerfil: perfil, responsaveis: [] });
    setDuplicatas([]);
    setErro('');
    setMostrarForm(true);
  };

  const abrirEditar = (p: PessoaCadastro) => {
    setEditId(p.id);
    setForm({
      nomeCompleto: p.nomeCompleto,
      telefone: p.telefone ?? '',
      maiorDeIdade: p.maiorDeIdade,
      tipoPerfil: p.tipoPerfil,
      responsaveis:
        p.responsaveis?.map((r) => ({
          nomeCompleto: r.nomeCompleto,
          telefone: r.telefone ?? '',
        })) ?? [],
    });
    setDuplicatas([]);
    setErro('');
    setMostrarForm(true);
  };

  const salvar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    setSalvando(true);
    const payload = {
      nomeCompleto: form.nomeCompleto.trim(),
      telefone: form.telefone.trim() || undefined,
      maiorDeIdade: form.maiorDeIdade,
      tipoPerfil: form.tipoPerfil,
      responsaveis: exigeResponsavel
        ? form.responsaveis
            .filter((r) => r.nomeCompleto.trim())
            .map((r) => ({
              nomeCompleto: r.nomeCompleto.trim(),
              telefone: r.telefone.trim() || undefined,
            }))
        : [],
    };
    try {
      if (editId) {
        await api(`/pessoas/${editId}`, { method: 'PUT', body: JSON.stringify(payload) });
      } else {
        await api('/pessoas', { method: 'POST', body: JSON.stringify(payload) });
      }
      setMostrarForm(false);
      await carregar();
    } catch (err) {
      setErro(err instanceof Error ? err.message : t('erp.pessoas.saveError'));
    } finally {
      setSalvando(false);
    }
  };

  const excluir = async (id: number) => {
    if (!confirm(t('erp.pessoas.deleteConfirm'))) return;
    try {
      await api(`/pessoas/${id}`, { method: 'DELETE' });
      await carregar();
    } catch (err) {
      alert(err instanceof Error ? err.message : t('erp.pessoas.deleteError'));
    }
  };

  const atualizarResponsavel = (index: number, field: keyof ResponsavelForm, value: string) => {
    setForm((f) => ({
      ...f,
      responsaveis: f.responsaveis.map((r, i) => (i === index ? { ...r, [field]: value } : r)),
    }));
  };

  const legado = pessoasPorPerfil.get('FUNCIONARIO') ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-xl font-serif text-[var(--color-accent)]">{t('erp.pessoas.title')}</h2>
          <p className="text-sm text-white/60 mt-1">{t('erp.pessoas.subtitle')}</p>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap bg-[var(--color-surface)] p-4 rounded-xl">
        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder={t('erp.pessoas.searchPlaceholder')}
          className="px-3 py-2 rounded bg-black/30 border border-white/20 flex-1 min-w-[200px] text-sm"
        />
        <button
          type="button"
          onClick={() => carregar()}
          className="px-4 py-2 bg-[var(--color-accent)] text-black rounded text-sm font-medium"
        >
          {t('erp.common.search')}
        </button>
      </div>

      {mostrarForm && canWrite && (
        <form onSubmit={salvar} className="bg-[var(--color-surface)] p-4 rounded-xl space-y-3">
          <h3 className="font-medium text-[var(--color-accent)]">
            {editId ? t('erp.pessoas.edit') : t('erp.pessoas.new')}
          </h3>
          {erro && <p className="text-[var(--color-danger)] text-sm">{erro}</p>}
          {duplicatas.length > 0 && (
            <div className="bg-amber-900/30 border border-amber-600/50 rounded p-3 text-sm">
              <p className="font-medium text-amber-200 mb-2">{t('erp.pessoas.duplicates')}</p>
              <ul className="space-y-1">
                {duplicatas.map((d) => (
                  <li key={d.id} className="text-white/80">
                    {d.nomeCompleto} {d.telefone && `— ${d.telefone}`}{' '}
                    <span className="text-amber-300/80">({labelEnum(t, 'duplicata', d.motivo)})</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <input
            value={form.nomeCompleto}
            onChange={(e) => setForm({ ...form, nomeCompleto: e.target.value })}
            placeholder={t('erp.pessoas.fullName')}
            className="w-full px-3 py-2 rounded bg-black/30 border border-white/20 text-sm"
            required
          />
          <input
            value={form.telefone}
            onChange={(e) => setForm({ ...form, telefone: e.target.value })}
            placeholder={t('erp.common.phone')}
            className="w-full px-3 py-2 rounded bg-black/30 border border-white/20 text-sm"
          />
          <div>
            <label className="text-xs text-white/60 block mb-1">{t('erp.pessoas.colFunction')}</label>
            <select
              value={form.tipoPerfil}
              onChange={(e) =>
                setForm({ ...form, tipoPerfil: e.target.value as TipoPerfil, responsaveis: [] })
              }
              className="w-full px-3 py-2 rounded bg-black/30 border border-white/20 text-sm"
            >
              {opcoesPerfil.map((p) => (
                <option key={p} value={p}>
                  {labelEnum(t, 'perfil', p)}
                </option>
              ))}
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.maiorDeIdade}
              onChange={(e) =>
                setForm({ ...form, maiorDeIdade: e.target.checked, responsaveis: [] })
              }
            />
            {t('erp.pessoas.adult')}
          </label>

          {exigeResponsavel && (
            <div className="space-y-2 border border-white/10 rounded-lg p-3">
              <p className="text-sm text-[var(--color-accent)]">{t('erp.pessoas.guardiansTitle')}</p>
              {form.responsaveis.map((r, index) => (
                <div key={index} className="grid gap-2 sm:grid-cols-2">
                  <input
                    value={r.nomeCompleto}
                    onChange={(e) => atualizarResponsavel(index, 'nomeCompleto', e.target.value)}
                    placeholder={t('erp.pessoas.guardianName')}
                    className="px-3 py-2 rounded bg-black/30 border border-white/20 text-sm"
                    required
                  />
                  <div className="flex gap-2">
                    <input
                      value={r.telefone}
                      onChange={(e) => atualizarResponsavel(index, 'telefone', e.target.value)}
                      placeholder={t('erp.pessoas.guardianPhone')}
                      className="flex-1 px-3 py-2 rounded bg-black/30 border border-white/20 text-sm"
                    />
                    {form.responsaveis.length > 1 && (
                      <button
                        type="button"
                        onClick={() =>
                          setForm((f) => ({
                            ...f,
                            responsaveis: f.responsaveis.filter((_, i) => i !== index),
                          }))
                        }
                        className="px-2 text-[var(--color-danger)] text-xs"
                      >
                        {t('erp.common.delete')}
                      </button>
                    )}
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={() =>
                  setForm((f) => ({ ...f, responsaveis: [...f.responsaveis, emptyResponsavel()] }))
                }
                className="text-xs px-3 py-1.5 rounded border border-white/20 hover:bg-white/10"
              >
                {t('erp.pessoas.addGuardian')}
              </button>
            </div>
          )}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={salvando}
              className="px-4 py-2 bg-[var(--color-accent)] text-black rounded text-sm disabled:opacity-50"
            >
              {salvando ? t('erp.common.saving') : t('erp.common.save')}
            </button>
            <button
              type="button"
              onClick={() => setMostrarForm(false)}
              className="px-4 py-2 bg-white/10 rounded text-sm"
            >
              {t('erp.common.cancel')}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-[var(--color-surface)] rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {CADASTRO_SECOES.map((secao) => (
            <CadastroSecaoTable
              key={secao.perfil}
              secao={secao}
              pessoas={pessoasPorPerfil.get(secao.perfil) ?? []}
              canWrite={canWrite}
              onEdit={abrirEditar}
              onDelete={excluir}
              onAdd={abrirNovo}
            />
          ))}
          {legado.length > 0 && (
            <CadastroSecaoTable
              secao={{
                perfil: 'FUNCIONARIO',
                titleKey: 'erp.pessoas.section.legacy',
                listKey: 'erp.pessoas.section.legacyList',
                showResponsaveis: false,
              }}
              pessoas={legado}
              canWrite={canWrite}
              onEdit={abrirEditar}
              onDelete={excluir}
              onAdd={abrirNovo}
            />
          )}
        </div>
      )}
    </div>
  );
}
