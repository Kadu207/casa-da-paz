import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../i18n/I18nContext';
import { labelEnum } from '../i18n/helpers';

interface Usuario {
  id: number;
  login: string;
  setorAcesso: string;
  pessoa: { id: number; nomeCompleto: string };
}

interface Pessoa {
  id: number;
  nomeCompleto: string;
}

const SETORES = ['DIRETORIA', 'FINANCEIRO', 'RECEPCAO', 'LIVRARIA', 'MEDIUM', 'SUPORTE'] as const;
const POLICY_RESOURCES = [
  'pessoas', 'financeiro', 'import', 'eventos', 'checkin', 'livraria', 'estoque',
  'dashboard', 'agendamentos', 'logs', 'ecommerce', 'auditoria', 'manutencao',
] as const;
const GRANT_OPTIONS = ['read', 'write', 'own', 'none'] as const;

type GrantOpt = (typeof GRANT_OPTIONS)[number];

interface PolicyPayload {
  customGrants: Partial<Record<string, GrantOpt>>;
  effectiveGrants: Partial<Record<string, GrantOpt>>;
  defaults: Partial<Record<string, GrantOpt>>;
}

export default function UsuariosPage() {
  const { user } = useAuth();
  const { t } = useI18n();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [pessoas, setPessoas] = useState<Pessoa[]>([]);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [redefinirId, setRedefinirId] = useState<number | null>(null);
  const [policyUserId, setPolicyUserId] = useState<number | null>(null);
  const [policyDraft, setPolicyDraft] = useState<Partial<Record<string, GrantOpt>>>({});
  const [policyDefaults, setPolicyDefaults] = useState<Partial<Record<string, GrantOpt>>>({});
  const [novaSenhaAdmin, setNovaSenhaAdmin] = useState('');
  const [erro, setErro] = useState('');
  const [form, setForm] = useState({
    login: '',
    senha: '',
    setorAcesso: 'RECEPCAO' as (typeof SETORES)[number],
    pessoaId: '',
  });

  const carregar = async () => {
    const [u, p] = await Promise.all([
      api<Usuario[]>('/auth/usuarios'),
      api<Pessoa[]>('/pessoas'),
    ]);
    setUsuarios(u);
    setPessoas(p);
  };

  useEffect(() => {
    carregar().catch(console.error);
  }, []);

  const salvar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    try {
      await api('/auth/usuarios', {
        method: 'POST',
        body: JSON.stringify({
          login: form.login.trim(),
          senha: form.senha,
          setorAcesso: form.setorAcesso,
          pessoaId: Number(form.pessoaId),
        }),
      });
      setMostrarForm(false);
      setForm({ login: '', senha: '', setorAcesso: 'RECEPCAO', pessoaId: '' });
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
    try {
      const data = await api<PolicyPayload>(`/auth/usuarios/${id}/politicas`);
      setPolicyDefaults(data.defaults);
      setPolicyDraft(data.customGrants ?? {});
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

  if (user?.setorAcesso !== 'SUPERVISOR') {
    return (
      <p className="text-white/70">{t('erp.usuarios.supervisorOnly')}</p>
    );
  }

  const pessoasSemUsuario = pessoas.filter((p) => !usuarios.some((u) => u.pessoa.id === p.id));
  const usuarioRedefinir = usuarios.find((u) => u.id === redefinirId);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xl font-serif text-[var(--color-accent)]">{t('erp.usuarios.title')}</h2>
        <button
          onClick={() => setMostrarForm(true)}
          className="px-4 py-2 bg-[var(--color-accent)] text-black rounded text-sm font-medium"
        >
          {t('erp.usuarios.new')}
        </button>
      </div>

      {mostrarForm && (
        <form onSubmit={salvar} className="bg-[var(--color-surface)] p-4 rounded-xl space-y-3 max-w-md">
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
          <select
            value={form.setorAcesso}
            onChange={(e) =>
              setForm({ ...form, setorAcesso: e.target.value as (typeof SETORES)[number] })
            }
            className="w-full px-3 py-2 rounded bg-black/30 border border-white/20"
          >
            {SETORES.map((s) => (
              <option key={s} value={s}>
                {labelEnum(t, 'setor', s)}
              </option>
            ))}
          </select>
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

      {policyUserId != null && (
        <form onSubmit={salvarPoliticas} className="bg-[var(--color-surface)] p-4 rounded-xl space-y-3">
          <h3 className="font-medium text-[var(--color-accent)]">{t('erp.usuarios.policiesTitle')}</h3>
          {erro && <p className="text-[var(--color-danger)] text-sm">{erro}</p>}
          <div className="grid gap-2 sm:grid-cols-2">
            {POLICY_RESOURCES.map((res) => (
              <label key={res} className="flex items-center justify-between gap-2 text-sm">
                <span className="capitalize">{res}</span>
                <select
                  value={policyDraft[res] ?? policyDefaults[res] ?? 'none'}
                  onChange={(e) =>
                    setPolicyDraft({ ...policyDraft, [res]: e.target.value as GrantOpt })
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
            <th className="p-2">{t('erp.common.actions')}</th>
          </tr>
        </thead>
        <tbody>
          {usuarios.map((u) => (
            <tr key={u.id} className="border-b border-white/10">
              <td className="p-2">{u.pessoa.nomeCompleto}</td>
              <td className="p-2">{u.login}</td>
              <td className="p-2">{labelEnum(t, 'setor', u.setorAcesso)}</td>
              <td className="p-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setErro('');
                    setRedefinirId(u.id);
                    setNovaSenhaAdmin('');
                  }}
                  className="text-xs px-2 py-1 rounded bg-white/10 hover:bg-white/20"
                >
                  {t('erp.usuarios.resetAction')}
                </button>
                {SETORES.includes(u.setorAcesso as (typeof SETORES)[number]) && (
                  <button
                    type="button"
                    onClick={() => abrirPoliticas(u.id)}
                    className="text-xs px-2 py-1 rounded bg-white/10 hover:bg-white/20"
                  >
                    {t('erp.usuarios.policiesAction')}
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
