import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { meuPerfil } from "@/lib/auth.functions";

export const Route = createFileRoute("/_authenticated/admin/")({
  head: () => ({
    meta: [
      { title: "Painel — Casa da Paz" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: AdminInicioPage,
});

function AdminInicioPage() {
  const [perfil, setPerfil] = useState<{
    nome: string;
    email: string;
    papel: "admin" | "atendente";
  } | null>(null);

  useEffect(() => {
    meuPerfil().then(setPerfil).catch(() => setPerfil(null));
  }, []);

  if (!perfil) return null;

  return (
    <section>
      <header>
        <p className="text-xs uppercase tracking-[0.2em] text-primary/80">
          Painel da Casa
        </p>
        <h1 className="mt-2 font-serif text-3xl sm:text-4xl text-primary">
          Olá, {perfil.nome || perfil.email}
        </h1>
        <p className="mt-2 text-foreground/80">
          Você está conectada como{" "}
          <strong className="text-foreground">{perfil.papel}</strong>.
        </p>
      </header>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {perfil.papel === "admin" && (
          <Link
            to="/admin/usuarios"
            className="block rounded-2xl border border-border/60 bg-card p-5 hover:border-primary/60 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background transition-colors"
          >
            <h2 className="font-serif text-xl text-primary">Equipe</h2>
            <p className="mt-1 text-sm text-foreground/80">
              Cadastrar, editar e remover acessos de pessoas da Casa.
            </p>
          </Link>
        )}

        <Link
          to="/admin/eventos"
          className="block rounded-2xl border border-border/60 bg-card p-5 hover:border-primary/60 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background transition-colors"
        >
          <h2 className="font-serif text-xl text-primary">Eventos</h2>
          <p className="mt-1 text-sm text-foreground/80">
            Criar, editar, publicar e organizar a agenda da Casa.
          </p>
        </Link>

        <div className="rounded-2xl border border-dashed border-border/60 bg-card/60 p-5">
          <h2 className="font-serif text-xl text-primary">Agendamentos</h2>
          <p className="mt-1 text-sm text-foreground/80">
            Em breve: lista dos pedidos por protocolo, com status real.
          </p>
        </div>
      </div>
    </section>
  );
}
