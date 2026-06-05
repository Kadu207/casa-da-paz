import { useEffect, useState } from 'react';
import { api } from '../lib/api';

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

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [pessoas, setPessoas] = useState<Pessoa[]>([]);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [redefinirId, setRedefinirId] = useState<number | null>(null);
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
      setErro(err instanceof Error ? err.message : 'Erro ao criar usuário');
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
      setErro(err instanceof Error ? err.message : 'Erro ao redefinir senha');
    }
  };

  const pessoasSemUsuario = pessoas.filter((p) => !usuarios.some((u) => u.pessoa.id === p.id));
  const usuarioRedefinir = usuarios.find((u) => u.id === redefinirId);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xl font-serif text-[var(--color-accent)]">Usuários</h2>
        <button
          onClick={() => setMostrarForm(true)}
          className="px-4 py-2 bg-[var(--color-accent)] text-black rounded text-sm font-medium"
        >
          Novo usuário
        </button>
      </div>

      {mostrarForm && (
        <form onSubmit={salvar} className="bg-[var(--color-surface)] p-4 rounded-xl space-y-3 max-w-md">
          <h3 className="font-medium text-[var(--color-accent)]">Novo usuário</h3>
          {erro && <p className="text-[var(--color-danger)] text-sm">{erro}</p>}
          <select
            value={form.pessoaId}
            onChange={(e) => setForm({ ...form, pessoaId: e.target.value })}
            className="w-full px-3 py-2 rounded bg-black/30 border border-white/20"
            required
          >
            <option value="">Selecione a pessoa</option>
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
            placeholder="Usuário (sem e-mail)"
            autoComplete="off"
            pattern="[a-zA-Z0-9._-]{3,50}"
            title="3–50 caracteres: letras, números, ponto, hífen ou underscore"
            className="w-full px-3 py-2 rounded bg-black/30 border border-white/20"
            required
          />
          <input
            type="password"
            value={form.senha}
            onChange={(e) => setForm({ ...form, senha: e.target.value })}
            placeholder="Senha (mín. 6)"
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
                {s}
              </option>
            ))}
          </select>
          <div className="flex gap-2">
            <button type="submit" className="px-4 py-2 bg-[var(--color-accent)] text-black rounded text-sm">
              Salvar
            </button>
            <button
              type="button"
              onClick={() => setMostrarForm(false)}
              className="px-4 py-2 bg-white/10 rounded text-sm"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {redefinirId != null && usuarioRedefinir && (
        <form onSubmit={redefinirSenha} className="bg-[var(--color-surface)] p-4 rounded-xl space-y-3 max-w-md">
          <h3 className="font-medium text-[var(--color-accent)]">
            Redefinir senha — {usuarioRedefinir.pessoa.nomeCompleto} ({usuarioRedefinir.login})
          </h3>
          {erro && <p className="text-[var(--color-danger)] text-sm">{erro}</p>}
          <input
            type="password"
            value={novaSenhaAdmin}
            onChange={(e) => setNovaSenhaAdmin(e.target.value)}
            placeholder="Nova senha (mín. 6)"
            minLength={6}
            className="w-full px-3 py-2 rounded bg-black/30 border border-white/20"
            required
          />
          <div className="flex gap-2">
            <button type="submit" className="px-4 py-2 bg-[var(--color-accent)] text-black rounded text-sm">
              Confirmar
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
              Cancelar
            </button>
          </div>
        </form>
      )}

      <table className="w-full text-sm">
        <thead>
          <tr className="text-left border-b border-white/20">
            <th className="p-2">Nome</th>
            <th className="p-2">Usuário</th>
            <th className="p-2">Setor</th>
            <th className="p-2">Ações</th>
          </tr>
        </thead>
        <tbody>
          {usuarios.map((u) => (
            <tr key={u.id} className="border-b border-white/10">
              <td className="p-2">{u.pessoa.nomeCompleto}</td>
              <td className="p-2">{u.login}</td>
              <td className="p-2">{u.setorAcesso}</td>
              <td className="p-2">
                <button
                  type="button"
                  onClick={() => {
                    setErro('');
                    setRedefinirId(u.id);
                    setNovaSenhaAdmin('');
                  }}
                  className="text-xs px-2 py-1 rounded bg-white/10 hover:bg-white/20"
                >
                  Redefinir senha
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
