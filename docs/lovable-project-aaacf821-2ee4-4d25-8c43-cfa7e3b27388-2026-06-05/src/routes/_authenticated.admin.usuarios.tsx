import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  atualizarUsuario,
  criarUsuario,
  listarUsuarios,
  meuPerfil,
  removerUsuario,
  type Papel,
  type UsuarioGerenciado,
} from "@/lib/auth.functions";

export const Route = createFileRoute("/_authenticated/admin/usuarios")({
  head: () => ({
    meta: [
      { title: "Equipe — Painel Casa da Paz" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: UsuariosPage,
});

type FormState = {
  id: string | null;
  nome: string;
  email: string;
  papel: Papel;
  senha: string;
};

const VAZIO: FormState = {
  id: null,
  nome: "",
  email: "",
  papel: "atendente",
  senha: "",
};

function UsuariosPage() {
  const navigate = useNavigate();
  const [perfil, setPerfil] = useState<{
    id: string;
    papel: Papel;
  } | null>(null);
  const [usuarios, setUsuarios] = useState<UsuarioGerenciado[]>([]);
  const [form, setForm] = useState<FormState>(VAZIO);
  const [feedback, setFeedback] = useState<
    | { tipo: "ok" | "erro"; texto: string; senha?: string | null }
    | null
  >(null);
  const [carregando, setCarregando] = useState(false);

  const recarregar = async () => {
    try {
      const lista = await listarUsuarios();
      setUsuarios(lista);
    } catch (err) {
      setFeedback({
        tipo: "erro",
        texto: err instanceof Error ? err.message : "Erro ao carregar.",
      });
    }
  };

  useEffect(() => {
    meuPerfil()
      .then((p) => {
        if (p.papel !== "admin") {
          navigate({ to: "/admin", replace: true });
          return;
        }
        setPerfil({ id: p.id, papel: p.papel });
        recarregar();
      })
      .catch(() => navigate({ to: "/login", replace: true }));
  }, [navigate]);

  const editando = form.id !== null;
  const ordenados = useMemo(
    () => [...usuarios].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR")),
    [usuarios],
  );

  const resetar = () => setForm(VAZIO);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    setCarregando(true);
    try {
      if (editando && form.id) {
        await atualizarUsuario({
          data: {
            id: form.id,
            nome: form.nome,
            papel: form.papel,
            novaSenha: form.senha ? form.senha : undefined,
          },
        });
        setFeedback({ tipo: "ok", texto: "Usuário atualizado." });
      } else {
        const res = await criarUsuario({
          data: {
            email: form.email,
            nome: form.nome,
            papel: form.papel,
            senha: form.senha || undefined,
          },
        });
        setFeedback({
          tipo: "ok",
          texto: res.senhaProvisoria
            ? "Usuário criado. Anote a senha provisória abaixo."
            : "Usuário criado.",
          senha: res.senhaProvisoria,
        });
      }
      resetar();
      await recarregar();
    } catch (err) {
      setFeedback({
        tipo: "erro",
        texto: err instanceof Error ? err.message : "Erro ao salvar.",
      });
    } finally {
      setCarregando(false);
    }
  };

  const editar = (u: UsuarioGerenciado) => {
    setForm({
      id: u.id,
      nome: u.nome,
      email: u.email,
      papel: u.papel,
      senha: "",
    });
    setFeedback(null);
  };

  const remover = async (u: UsuarioGerenciado) => {
    if (perfil?.id === u.id) {
      setFeedback({
        tipo: "erro",
        texto: "Você não pode remover sua própria conta.",
      });
      return;
    }
    if (!confirm(`Remover ${u.nome || u.email}?`)) return;
    try {
      await removerUsuario({ data: { id: u.id } });
      setFeedback({ tipo: "ok", texto: "Usuário removido." });
      if (form.id === u.id) resetar();
      await recarregar();
    } catch (err) {
      setFeedback({
        tipo: "erro",
        texto: err instanceof Error ? err.message : "Erro ao remover.",
      });
    }
  };

  if (!perfil) return null;

  return (
    <section>
      <header>
        <p className="text-xs uppercase tracking-[0.2em] text-primary/80">
          Equipe da Casa
        </p>
        <h1 className="mt-2 font-serif text-3xl sm:text-4xl text-primary">
          Usuários e papéis
        </h1>
        <p className="mt-2 text-foreground/80 text-sm max-w-2xl">
          Cadastre acessos para a equipe. <strong>Admin</strong> gere tudo;{" "}
          <strong>Atendente</strong> acessa apenas o painel básico. As senhas
          ficam protegidas no servidor (hash) — não são armazenadas em texto
          puro.
        </p>
      </header>

      {feedback && (
        <div
          role="status"
          aria-live="polite"
          className={`mt-5 rounded-xl px-4 py-3 text-sm border ${
            feedback.tipo === "ok"
              ? "border-primary/40 bg-primary/10 text-foreground"
              : "border-[color:var(--color-destructive)]/60 bg-[color:var(--color-destructive)]/10 text-[color:var(--color-destructive)]"
          }`}
        >
          <p>{feedback.texto}</p>
          {feedback.senha && (
            <p className="mt-2">
              <strong>Senha provisória:</strong>{" "}
              <code className="select-all break-all">{feedback.senha}</code>
            </p>
          )}
        </div>
      )}

      <form
        onSubmit={onSubmit}
        className="mt-6 rounded-2xl bg-card border border-border/60 p-5 sm:p-6 grid gap-4 sm:grid-cols-2"
        noValidate
      >
        <h2 className="sm:col-span-2 font-serif text-xl text-primary">
          {editando ? "Editar usuário" : "Novo usuário"}
        </h2>

        <div>
          <label htmlFor="nome" className="block text-sm font-medium mb-1.5">
            Nome
          </label>
          <input
            id="nome"
            required
            value={form.nome}
            onChange={(e) => setForm({ ...form, nome: e.target.value })}
            className="w-full min-h-11 px-3.5 py-2.5 rounded-xl border border-border bg-background/40 focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          />
        </div>

        <div>
          <label htmlFor="email-u" className="block text-sm font-medium mb-1.5">
            E-mail{" "}
            {editando && (
              <span className="text-xs text-foreground/60">(não editável)</span>
            )}
          </label>
          <input
            id="email-u"
            type="email"
            required={!editando}
            disabled={editando}
            autoComplete="off"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full min-h-11 px-3.5 py-2.5 rounded-xl border border-border bg-background/40 focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:opacity-60"
          />
        </div>

        <div>
          <label htmlFor="papel" className="block text-sm font-medium mb-1.5">
            Papel
          </label>
          <select
            id="papel"
            value={form.papel}
            onChange={(e) =>
              setForm({ ...form, papel: e.target.value as Papel })
            }
            className="w-full min-h-11 px-3.5 py-2.5 rounded-xl border border-border bg-background/40 focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            <option value="atendente">Atendente</option>
            <option value="admin">Administrador</option>
          </select>
        </div>

        <div>
          <label htmlFor="senha-u" className="block text-sm font-medium mb-1.5">
            Senha{" "}
            <span className="text-xs text-foreground/60">
              {editando
                ? "(deixe vazio para manter)"
                : "(opcional — vazio gera senha provisória)"}
            </span>
          </label>
          <input
            id="senha-u"
            type="text"
            autoComplete="new-password"
            minLength={8}
            value={form.senha}
            onChange={(e) => setForm({ ...form, senha: e.target.value })}
            className="w-full min-h-11 px-3.5 py-2.5 rounded-xl border border-border bg-background/40 focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          />
        </div>

        <div className="sm:col-span-2 flex flex-wrap gap-2 pt-1">
          <button
            type="submit"
            disabled={carregando}
            className="min-h-11 inline-flex items-center justify-center rounded-xl bg-primary text-primary-foreground font-medium px-5 py-2.5 hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 transition-colors disabled:opacity-60"
          >
            {carregando
              ? "Salvando…"
              : editando
                ? "Salvar alterações"
                : "Cadastrar"}
          </button>
          {editando && (
            <button
              type="button"
              onClick={resetar}
              className="min-h-11 inline-flex items-center justify-center rounded-xl border border-border px-5 py-2.5 hover:bg-primary/10"
            >
              Cancelar
            </button>
          )}
        </div>
      </form>

      <div className="mt-8 overflow-x-auto rounded-2xl border border-border/60 bg-card">
        <table className="w-full text-sm">
          <thead className="bg-card/80 text-foreground/80">
            <tr>
              <th scope="col" className="text-left px-4 py-3">Nome</th>
              <th scope="col" className="text-left px-4 py-3">E-mail</th>
              <th scope="col" className="text-left px-4 py-3">Papel</th>
              <th scope="col" className="text-right px-4 py-3">Ações</th>
            </tr>
          </thead>
          <tbody>
            {ordenados.map((u) => (
              <tr
                key={u.id}
                className="border-t border-border/60 align-middle"
              >
                <td className="px-4 py-3 font-medium">{u.nome || "—"}</td>
                <td className="px-4 py-3 text-foreground/85">{u.email}</td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 text-primary text-xs px-2.5 py-1 uppercase tracking-wider">
                    {u.papel}
                  </span>
                </td>
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() => editar(u)}
                    className="min-h-9 inline-flex items-center justify-center rounded-lg border border-border px-3 py-1.5 mr-2 text-xs hover:bg-primary/10"
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => remover(u)}
                    className="min-h-9 inline-flex items-center justify-center rounded-lg border border-[color:var(--color-destructive)]/50 text-[color:var(--color-destructive)] px-3 py-1.5 text-xs hover:bg-[color:var(--color-destructive)]/10"
                  >
                    Remover
                  </button>
                </td>
              </tr>
            ))}
            {ordenados.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-foreground/70">
                  Nenhum usuário cadastrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
