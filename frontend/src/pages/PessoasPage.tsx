import { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../i18n/I18nContext';
import { labelEnum } from '../i18n/helpers';

type TipoPerfil = 'CONSULENTE' | 'MEDIUM' | 'DIRETORIA' | 'FUNCIONARIO';

interface Pessoa {
  id: number;
  nomeCompleto: string;
  telefone: string | null;
  maiorDeIdade: boolean;
  tipoPerfil: TipoPerfil;
  dataCadastro: string;
}

interface DuplicataSugerida extends Pessoa {
  motivo: 'telefone' | 'nome';
}

const PERFIS: TipoPerfil[] = ['CONSULENTE', 'MEDIUM', 'DIRETORIA', 'FUNCIONARIO'];

const emptyForm = {
  nomeCompleto: '',
  telefone: '',
  maiorDeIdade: true,
  tipoPerfil: 'CONSULENTE' as TipoPerfil,
};

export default function PessoasPage() {
  const { t, dateLocale } = useI18n();
  const { user } = useAuth();
  const canWrite = user?.setorAcesso === 'DIRETORIA' || user?.setorAcesso === 'RECEPCAO';

  const [pessoas, setPessoas] = useState<Pessoa[]>([]);
  const [busca, setBusca] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<number | null>(null);
  const [duplicatas, setDuplicatas] = useState<DuplicataSugerida[]>([]);
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [mostrarForm, setMostrarForm] = useState(false);

  const carregar = useCallback(async () => {
    const q = busca.trim();
    const path = q ? `/pessoas?q=${encodeURIComponent(q)}` : '/pessoas';
    const data = await api<Pessoa[]>(path);
    setPessoas(data);
  }, [busca]);

  useEffect(() => {
    carregar().catch(console.error);
  }, [carregar]);

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

  const abrirNovo = () => {
    setEditId(null);
    setForm(emptyForm);
    setDuplicatas([]);
    setErro('');
    setMostrarForm(true);
  };

  const abrirEditar = (p: Pessoa) => {
    setEditId(p.id);
    setForm({
      nomeCompleto: p.nomeCompleto,
      telefone: p.telefone ?? '',
      maiorDeIdade: p.maiorDeIdade,
      tipoPerfil: p.tipoPerfil,
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

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xl font-serif text-[var(--color-accent)]">{t('erp.pessoas.title')}</h2>
        {canWrite && (
          <button
            onClick={abrirNovo}
            className="px-4 py-2 bg-[var(--color-accent)] text-black rounded text-sm font-medium"
          >
            {t('erp.pessoas.new')}
          </button>
        )}
      </div>

      <div className="flex gap-2 flex-wrap">
        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder={t('erp.pessoas.searchPlaceholder')}
          className="px-3 py-2 rounded bg-black/30 border border-white/20 flex-1 min-w-[200px]"
        />
        <button onClick={() => carregar()} className="px-4 py-2 bg-white/10 rounded text-sm">
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
            className="w-full px-3 py-2 rounded bg-black/30 border border-white/20"
            required
          />
          <input
            value={form.telefone}
            onChange={(e) => setForm({ ...form, telefone: e.target.value })}
            placeholder={t('erp.common.phone')}
            className="w-full px-3 py-2 rounded bg-black/30 border border-white/20"
          />
          <select
            value={form.tipoPerfil}
            onChange={(e) => setForm({ ...form, tipoPerfil: e.target.value as TipoPerfil })}
            className="w-full px-3 py-2 rounded bg-black/30 border border-white/20"
          >
            {PERFIS.map((p) => (
              <option key={p} value={p}>
                {labelEnum(t, 'perfil', p)}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.maiorDeIdade}
              onChange={(e) => setForm({ ...form, maiorDeIdade: e.target.checked })}
            />
            {t('erp.pessoas.adult')}
          </label>
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

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b border-white/20">
              <th className="p-2">{t('erp.common.name')}</th>
              <th className="p-2">{t('erp.common.phone')}</th>
              <th className="p-2">{t('erp.common.status')}</th>
              <th className="p-2">{t('erp.common.registered')}</th>
              {canWrite && <th className="p-2">{t('erp.common.actions')}</th>}
            </tr>
          </thead>
          <tbody>
            {pessoas.map((p) => (
              <tr key={p.id} className="border-b border-white/10">
                <td className="p-2">{p.nomeCompleto}</td>
                <td className="p-2 text-white/70">{p.telefone ?? t('erp.common.emptyDash')}</td>
                <td className="p-2">{labelEnum(t, 'perfil', p.tipoPerfil)}</td>
                <td className="p-2 text-white/60">
                  {new Date(p.dataCadastro).toLocaleDateString(dateLocale)}
                </td>
                {canWrite && (
                  <td className="p-2 space-x-2">
                    <button onClick={() => abrirEditar(p)} className="text-[var(--color-accent)] hover:underline">
                      {t('erp.common.edit')}
                    </button>
                    <button onClick={() => excluir(p.id)} className="text-[var(--color-danger)] hover:underline">
                      {t('erp.common.delete')}
                    </button>
                  </td>
                )}
              </tr>
            ))}
            {pessoas.length === 0 && (
              <tr>
                <td colSpan={canWrite ? 5 : 4} className="p-4 text-center text-white/50">
                  {t('erp.pessoas.empty')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
