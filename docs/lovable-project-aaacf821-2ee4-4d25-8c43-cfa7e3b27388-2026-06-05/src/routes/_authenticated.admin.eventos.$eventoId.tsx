import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { EventoForm } from "@/components/EventoForm";
import { useAtualizarEvento, useEvento } from "@/lib/eventos-store";
import { registrarAcaoAdmin } from "@/lib/auditoria.functions";

export const Route = createFileRoute(
  "/_authenticated/admin/eventos/$eventoId",
)({
  head: () => ({
    meta: [
      { title: "Editar evento — Painel Casa da Paz" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: AdminEditarEventoPage,
});

function AdminEditarEventoPage() {
  const { eventoId } = Route.useParams();
  const navigate = useNavigate();
  const { data: evento, isLoading, error } = useEvento(eventoId);
  const atualizar = useAtualizarEvento();
  const registrar = useServerFn(registrarAcaoAdmin);
  const [erro, setErro] = useState<string | null>(null);

  if (isLoading) {
    return (
      <section className="max-w-2xl">
        <p className="text-foreground/70">Carregando…</p>
      </section>
    );
  }

  if (error || !evento) {
    return (
      <section className="max-w-2xl">
        <Link
          to="/admin/eventos"
          className="text-sm text-foreground/80 hover:text-primary"
        >
          ← Voltar para eventos
        </Link>
        <h1 className="mt-4 font-serif text-3xl text-primary">
          Evento não encontrado
        </h1>
        <p className="mt-2 text-sm text-foreground/80">
          {(error as Error)?.message ??
            "Esse evento pode ter sido removido."}
        </p>
      </section>
    );
  }

  return (
    <section className="max-w-2xl">
      <Link
        to="/admin/eventos"
        className="text-sm text-foreground/80 hover:text-primary"
      >
        ← Voltar para eventos
      </Link>
      <h1 className="mt-4 font-serif text-3xl text-primary">Editar evento</h1>
      <p className="mt-2 text-sm text-foreground/80">
        Atualize as informações abaixo. O slug ({evento.id}) não muda.
      </p>

      {erro && (
        <div
          role="alert"
          className="mt-4 rounded-xl border border-[color:var(--color-destructive)]/60 bg-[color:var(--color-destructive)]/10 text-[color:var(--color-destructive)] px-4 py-3 text-sm"
        >
          {erro}
        </div>
      )}

      <div className="mt-4">
        <EventoForm
          inicial={evento}
          textoBotao="Salvar alterações"
          enviando={atualizar.isPending}
          onSubmit={async (dados) => {
            setErro(null);
            try {
              await atualizar.mutateAsync({ slug: evento.id, patch: dados });
              registrar({
                data: {
                  rota: "admin/eventos/atualizar",
                  motivo: `editou evento ${evento.id}`,
                },
              }).catch(() => undefined);
              navigate({ to: "/admin/eventos" });
            } catch (e) {
              setErro(
                e instanceof Error ? e.message : "Falha ao salvar evento.",
              );
            }
          }}
        />
      </div>
    </section>
  );
}
