import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../i18n/I18nContext';
import { labelEnum } from '../i18n/helpers';

interface Usuario {
  id: number;
  login: string;
  setorAcesso: string;
  ativo?: boolean;
  pessoa: { id: number; nomeCompleto: string };
  policy?: Partial<Record<string, GrantOpt>> | null;
}

interface Pessoa {
  id: number;
  nomeCompleto: string;
}

const SETORES = ['DIRETORIA', 'FINANCEIRO', 'TESOURARIA', 'MARKETING', 'RECEPCAO', 'LIVRARIA', 'MEDIUM', 'SUPORTE'] as const;
const GRANT_OPTIONS = ['read', 'write', 'own', 'none'] as const;

type GrantOpt = (typeof GRANT_OPTIONS)[number];
type SetorOp = (typeof SETORES)[number];

interface Catalogo {
  resources: string[];
  grants: GrantOpt[];
  defaults: Record<SetorOp, Partial<Record<string, GrantOpt>>>;
}

interface PolicyPayload {
  customGrants: Partial<Record<string, GrantOpt>>;
  effectiveGrants: Partial<Record<string, GrantOpt>>;
  defaults: Partial<Record<string, GrantOpt>>;
}

function PolicyGrantsEditor({
  resources,
  draft,
  onChange,
}: {
  resources: string[];
  draft: Partial<Record<string, GrantOpt>>;
  onChange: (next: Partial<Record<string, GrantOpt>>) => void;
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-2 max-h-72 overflow-y-auto border border-white/10 rounded-lg p-3">
      {resources.map((res) => (
        <label key={res} className="flex items-center justify-between gap-2 text-sm">
          <span className="capitalize text-white/80">{res.replace(/_/g, ' ')}</span>
          <select
            value={draft[res] ?? 'none'}
            onChange={(e) =>
              onChange({ ...draft, [res]: e.target.value as GrantOpt })
            }
            className="px-2 py-1 rounded bg-black/30 border border-white/20 text-xs"
          >
            {GRANT_OPTIONS.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </label>
      ))}
    </div>
  );
}

export default function UsuariosPage() {
  const { user } = useAuth();
  const { t } = useI18n();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [pessoas, setPessoas] = useState<Pessoa[]>([]);
  const [catalogo, setCatalogo] = useState<Catalogo | null>(null);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ login: '', setorAcesso: 'RECEPCAO' as SetorOp });
  const [redefinirId, setRedefinirId] = useState<number | null>(null);
  const [policyUserId, setPolicyUserId] = useState<number | null>(null);
  const [policyDraft, setPolicyDraft] = useState<Partial<Record<string, GrantOpt>>>({});
  const [novaSenhaAdmin, setNovaSenhaAdmin] = useState('');
  const [erro, setErro] = useState('');
  const [form, setForm] = useState({
    login: '',
    senha: '',
    setorAcesso: 'RECEPCAO' as SetorOp,
    pessoaId: '',
    grants: {} as Partial<Record<string, GrantOpt>>,
  });

  const resources = useMemo(
    () =>
      (catalogo?.resources ?? []).filter(
        (r) => r !== 'usuarios' && r !== 'webhooks' && r !== 'integracoes'
      ),
    [catalogo]
  );

  const carregar = useCallback(async () => {
    const [u, p, cat] = await Promise.all([
      api<Usuario[]>('/auth/usuarios'),
      api<Pessoa[]>('/pessoas'),
      api<Catalogo>('/auth/politicas/catalogo'),
    ]);
    setUsuarios(u);
    setPessoas(p);
    setCatalogo(cat);
  }, []);

  useEffect(() => {
    carregar().catch(console.error);
  }, [carregar]);

  const grantsParaSetor = useCallback(
    (setor: SetorOp): Partial<Record<string, GrantOpt>> => {
      const defaults = catalogo?.defaults?.[setor] ?? {};
      const next: Partial<Record<string, GrantOpt>> = {};
      for (const res of resources) {
        next[res] = defaults[res] ?? 'none';
      }
      return next;
    },
    [catalogo, resources]
  );

  const abrirNovo = () => {
    setErro('');
    setPolicyUserId(null);
    setRedefinirId(null);
    const setor: SetorOp = 'RECEPCAO';
    setForm({
      login: '',
      senha: '',
      setorAcesso: setor,
      pessoaId: '',
      grants: grantsParaSetor(setor),
    });
    setMostrarForm(true);
  };

  const alterarSetor = (setor: SetorOp) => {
    setForm((f) => ({
      ...f,
      setorAcesso: setor,
      grants: grantsParaSetor(setor),
    }));
  };

  const salvar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    if (Object.keys(form.grants).length === 0) {
      setErro(t('erp.usuarios.policyRequired'));
      return;
    }
    try {
      await api('/auth/usuarios', {
        method: 'POST',
        body: JSON.stringify({
          login: form.login.trim(),
          senha: form.senha,
          setorAcesso: form.setorAcesso,
          pessoaId: Number(form.pessoaId),
          grants: form.grants,
        }),
      });
      setMostrarForm(false);
      setForm({
        login: '',
        senha: '',
        setorAcesso: 'RECEPCAO',
        pessoaId: '',
        grants: {},
      });
      await carregar();
    } catch (err) {
      setErro(err instanceof Error ? err.message : t('erp.usuarios.createError'));
    }
  };

  const redefinirSenha = async (e: React.FormEvent) => {
    e.preventDefault();
    if (redefinirId == null) return;
    setErro('');
    try {
      await api(`/auth/usuarios/${redefinirId}`, {
        method: 'PUT',
        body: JSON.stringify({ senha: novaSenhaAdmin }),
      });
      setRedefinirId(null);
      setNovaSenhaAdmin('');
    } catch (err) {
      setErro(err instanceof Error ? err.message : t('erp.usuarios.resetError'));
    }
  };

  const abrirPoliticas = async (id: number) => {
    setErro('');
    setMostrarForm(false);
    try {
      const data = await api<PolicyPayload>(`/auth/usuarios/${id}/politicas`);
      const draft: Partial<Record<string, GrantOpt>> = {};
      for (const res of resources) {
        draft[res] =
          data.customGrants[res] ?? data.effectiveGrants[res] ?? data.defaults[res] ?? 'none';
      }
      setPolicyDraft(draft);
      setPolicyUserId(id);
    } catch (err) {
      setErro(err instanceof Error ? err.message : t('erp.usuarios.policyLoadError'));
    }
  };

  const salvarPoliticas = async (e: React.FormEvent) => {
    e.preventDefault();
    if (policyUserId == null) return;
    setErro('');
    try {
      await api(`/auth/usuarios/${policyUserId}/politicas`, {
        method: 'PUT',
        body: JSON.stringify({ grants: policyDraft }),
      });
      setPolicyUserId(null);
      await carregar();
    } catch (err) {
      setErro(err instanceof Error ? err.message : t('erp.usuarios.policySaveError'));
    }
  };

  const abrirEdicao = (u: Usuario) => {
    setErro('');
    setMostrarForm(false);
    setPolicyUserId(null);
    setRedefinirId(null);
    setEditId(u.id);
    setEditForm({
      login: u.login,
      setorAcesso: (SETORES.includes(u.setorAcesso as SetorOp)
        ? u.setorAcesso
        : 'RECEPCAO') as SetorOp,
    });
  };

  const salvarEdicao = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editId == null) return;
    setErro('');
    try {
      await api(`/auth/usuarios/${editId}`, {
        method: 'PUT',
        body: JSON.stringify({
          login: editForm.login,
          setorAcesso: editForm.setorAcesso,
        }),
      });
      setEditId(null);
      await carregar();
    } catch (err) {
      setErro(err instanceof Error ? err.message : t('erp.usuarios.editError'));
    }
  };

  const alternarAtivo = async (u: Usuario) => {
    setErro('');
    const next = !(u.ativo !== false);
    if (
      !window.confirm(
        next ? t('erp.usuarios.confirmActivate') : t('erp.usuarios.confirmDeactivate')
      )
    ) {
      return;
    }
    try {
      await api(`/auth/usuarios/${u.id}`, {
        method: 'PUT',
        body: JSON.stringify({ ativo: next }),
      });
      await carregar();
    } catch (err) {
      setErro(err instanceof Error ? err.message : t('erp.usuarios.toggleError'));
    }
  };

  const excluirUsuario = async (u: Usuario) => {
    setErro('');
    if (!window.confirm(t('erp.usuarios.confirmDelete', { login: u.login }))) return;
    try {
      await api(`/auth/usuarios/${u.id}`, { method: 'DELETE' });
      await carregar();
    } catch (err) {
      setErro(err instanceof Error ? err.message : t('erp.usuarios.deleteError'));
    }
  };

  if (user?.setorAcesso !== 'SUPERVISOR') {
    return (
      <p className="text-white/70">{t('erp.usuarios.supervisorOnly')}</p>
    );
  }

  const pessoasSemUsuario = pessoas.filter((p) => !usuarios.some((u) => u.pessoa.id === p.id));
  const usuarioRedefinir = usuarios.find((u) => u.id === redefinirId);
  const usuarioEdit = usuarios.find((u) => u.id === editId);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-xl font-serif text-[var(--color-accent)]">{t('erp.usuarios.title')}</h2>
          <p className="text-sm text-white/60 mt-1">{t('erp.usuarios.subtitle')}</p>
        </div>
        <button
          type="button"
          onClick={abrirNovo}
          disabled={!catalogo}
          className="px-4 py-2 bg-[var(--color-accent)] text-black rounded text-sm font-medium disabled:opacity-50"
        >
          {t('erp.usuarios.new')}
        </button>
      </div>

      {mostrarForm && (
        <form onSubmit={salvar} className="bg-[var(--color-surface)] p-4 rounded-xl space-y-3 max-w-3xl">
          <h3 className="font-medium text-[var(--color-accent)]">{t('erp.usuarios.new')}</h3>
          {erro && <p className="text-[var(--color-danger)] text-sm">{erro}</p>}
          <select
            value={form.pessoaId}
            onChange={(e) => setForm({ ...form, pessoaId: e.target.value })}
            className="w-full px-3 py-2 rounded bg-black/30 border border-white/20"
            required
          >
            <option value="">{t('erp.usuarios.selectPerson')}</option>
            {pessoasSemUsuario.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nomeCompleto}
              </option>
            ))}
          </select>
          <input
            type="text"
            value={form.login}
            onChange={(e) => setForm({ ...form, login: e.target.value })}
            placeholder={t('erp.usuarios.loginPlaceholder')}
            autoComplete="off"
            pattern="[a-zA-Z0-9._-]{3,50}"
            title={t('erp.usuarios.loginHint')}
            className="w-full px-3 py-2 rounded bg-black/30 border border-white/20"
            required
          />
          <input
            type="password"
            value={form.senha}
            onChange={(e) => setForm({ ...form, senha: e.target.value })}
            placeholder={t('erp.usuarios.passwordNew')}
            minLength={6}
            className="w-full px-3 py-2 rounded bg-black/30 border border-white/20"
            required
          />
          <div>
            <label className="text-xs text-white/60 block mb-1">{t('erp.usuarios.colSector')}</label>
            <select
              value={form.setorAcesso}
              onChange={(e) => alterarSetor(e.target.value as SetorOp)}
              className="w-full px-3 py-2 rounded bg-black/30 border border-white/20"
            >
              {SETORES.map((s) => (
                <option key={s} value={s}>
                  {labelEnum(t, 'setor', s)}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-medium text-[var(--color-accent)]">
              {t('erp.usuarios.policiesAtCreate')}
            </h4>
            <p className="text-xs text-white/50">{t('erp.usuarios.policiesAtCreateHint')}</p>
            <PolicyGrantsEditor
              resources={resources}
              draft={form.grants}
              onChange={(grants) => setForm({ ...form, grants })}
            />
          </div>

          <div className="flex gap-2">
            <button type="submit" className="px-4 py-2 bg-[var(--color-accent)] text-black rounded text-sm">
              {t('erp.common.save')}
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

      {redefinirId != null && usuarioRedefinir && (
        <form onSubmit={redefinirSenha} className="bg-[var(--color-surface)] p-4 rounded-xl space-y-3 max-w-md">
          <h3 className="font-medium text-[var(--color-accent)]">
            {t('erp.usuarios.resetTitle', {
              name: usuarioRedefinir.pessoa.nomeCompleto,
              login: usuarioRedefinir.login,
            })}
          </h3>
          {erro && <p className="text-[var(--color-danger)] text-sm">{erro}</p>}
          <input
            type="password"
            value={novaSenhaAdmin}
            onChange={(e) => setNovaSenhaAdmin(e.target.value)}
            placeholder={t('erp.usuarios.passwordReset')}
            minLength={6}
            className="w-full px-3 py-2 rounded bg-black/30 border border-white/20"
            required
          />
          <div className="flex gap-2">
            <button type="submit" className="px-4 py-2 bg-[var(--color-accent)] text-black rounded text-sm">
              {t('erp.common.confirm')}
            </button>
            <button
              type="button"
              onClick={() => {
                setRedefinirId(null);
                setNovaSenhaAdmin('');
                setErro('');
              }}
              className="px-4 py-2 bg-white/10 rounded text-sm"
            >
              {t('erp.common.cancel')}
            </button>
          </div>
        </form>
      )}

      {editId != null && usuarioEdit && (
        <form onSubmit={salvarEdicao} className="bg-[var(--color-surface)] p-4 rounded-xl space-y-3 max-w-md">
          <h3 className="font-medium text-[var(--color-accent)]">
            {t('erp.usuarios.editTitle', { login: usuarioEdit.login })}
          </h3>
          {erro && <p className="text-[var(--color-danger)] text-sm">{erro}</p>}
          <input
            type="text"
            value={editForm.login}
            onChange={(e) => setEditForm({ ...editForm, login: e.target.value })}
            className="w-full px-3 py-2 rounded bg-black/30 border border-white/20"
            pattern="[a-zA-Z0-9._-]{3,50}"
            required
          />
          <select
            value={editForm.setorAcesso}
            onChange={(e) =>
              setEditForm({ ...editForm, setorAcesso: e.target.value as SetorOp })
            }
            className="w-full px-3 py-2 rounded bg-black/30 border border-white/20"
          >
            {SETORES.map((s) => (
              <option key={s} value={s}>
                {labelEnum(t, 'setor', s)}
              </option>
            ))}
          </select>
          <p className="text-xs text-white/50">{t('erp.usuarios.editSectorHint')}</p>
          <div className="flex gap-2">
            <button type="submit" className="px-4 py-2 bg-[var(--color-accent)] text-black rounded text-sm">
              {t('erp.common.save')}
            </button>
            <button
              type="button"
              onClick={() => setEditId(null)}
              className="px-4 py-2 bg-white/10 rounded text-sm"
            >
              {t('erp.common.cancel')}
            </button>
          </div>
        </form>
      )}

      {policyUserId != null && (
        <form onSubmit={salvarPoliticas} className="bg-[var(--color-surface)] p-4 rounded-xl space-y-3 max-w-3xl">
          <h3 className="font-medium text-[var(--color-accent)]">{t('erp.usuarios.policiesTitle')}</h3>
          {erro && <p className="text-[var(--color-danger)] text-sm">{erro}</p>}
          <PolicyGrantsEditor
            resources={resources}
            draft={policyDraft}
            onChange={setPolicyDraft}
          />
          <div className="flex gap-2">
            <button type="submit" className="px-4 py-2 bg-[var(--color-accent)] text-black rounded text-sm">
              {t('erp.common.save')}
            </button>
            <button
              type="button"
              onClick={() => setPolicyUserId(null)}
              className="px-4 py-2 bg-white/10 rounded text-sm"
            >
              {t('erp.common.cancel')}
            </button>
          </div>
        </form>
      )}

      <table className="w-full text-sm">
        <thead>
          <tr className="text-left border-b border-white/20">
            <th className="p-2">{t('erp.common.name')}</th>
            <th className="p-2">{t('erp.usuarios.colLogin')}</th>
            <th className="p-2">{t('erp.usuarios.colSector')}</th>
            <th className="p-2">{t('erp.usuarios.colStatus')}</th>
            <th className="p-2">{t('erp.usuarios.colPolicy')}</th>
            <th className="p-2">{t('erp.common.actions')}</th>
          </tr>
        </thead>
        <tbody>
          {usuarios.map((u) => (
            <tr key={u.id} className="border-b border-white/10">
              <td className="p-2">{u.pessoa.nomeCompleto}</td>
              <td className="p-2">{u.login}</td>
              <td className="p-2">{labelEnum(t, 'setor', u.setorAcesso)}</td>
              <td className="p-2 text-xs">
                {u.ativo === false ? (
                  <span className="text-[var(--color-danger)]">{t('erp.usuarios.statusInactive')}</span>
                ) : (
                  <span className="text-emerald-400/90">{t('erp.usuarios.statusActive')}</span>
                )}
              </td>
              <td className="p-2 text-xs text-white/70">
                {u.policy && Object.keys(u.policy).length > 0
                  ? t('erp.usuarios.policyDefined')
                  : t('erp.usuarios.policyMissing')}
              </td>
              <td className="p-2 flex flex-wrap gap-2">
                {SETORES.includes(u.setorAcesso as SetorOp) && (
                  <button
                    type="button"
                    onClick={() => abrirEdicao(u)}
                    className="text-xs px-2 py-1 rounded bg-white/10 hover:bg-white/20"
                  >
                    {t('erp.common.edit')}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setErro('');
                    setMostrarForm(false);
                    setPolicyUserId(null);
                    setEditId(null);
                    setRedefinirId(u.id);
                    setNovaSenhaAdmin('');
                  }}
                  className="text-xs px-2 py-1 rounded bg-white/10 hover:bg-white/20"
                >
                  {t('erp.usuarios.resetAction')}
                </button>
                {SETORES.includes(u.setorAcesso as SetorOp) && (
                  <button
                    type="button"
                    onClick={() => abrirPoliticas(u.id)}
                    className="text-xs px-2 py-1 rounded bg-white/10 hover:bg-white/20"
                  >
                    {t('erp.usuarios.policiesAction')}
                  </button>
                )}
                {SETORES.includes(u.setorAcesso as SetorOp) && (
                  <button
                    type="button"
                    onClick={() => alternarAtivo(u)}
                    className="text-xs px-2 py-1 rounded bg-white/10 hover:bg-white/20"
                  >
                    {u.ativo === false
                      ? t('erp.usuarios.activateAction')
                      : t('erp.usuarios.deactivateAction')}
                  </button>
                )}
                {SETORES.includes(u.setorAcesso as SetorOp) && (
                  <button
                    type="button"
                    onClick={() => excluirUsuario(u)}
                    className="text-xs px-2 py-1 rounded bg-red-500/20 text-red-200 hover:bg-red-500/30"
                  >
                    {t('erp.common.delete')}
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
