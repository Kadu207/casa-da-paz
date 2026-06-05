import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { EventoForm } from "@/components/EventoForm";
import { useCriarEvento } from "@/lib/eventos-store";
import { registrarAcaoAdmin } from "@/lib/auditoria.functions";

export const Route = createFileRoute("/_authenticated/admin/eventos/novo")({
  head: () => ({
    meta: [
      { title: "Novo evento — Painel Casa da Paz" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: AdminNovoEventoPage,
});

function AdminNovoEventoPage() {
  const navigate = useNavigate();
  const criar = useCriarEvento();
  const registrar = useServerFn(registrarAcaoAdmin);
  const [erro, setErro] = useState<string | null>(null);

  return (
    <section className="max-w-2xl">
      <Link
        to="/admin/eventos"
        className="text-sm text-foreground/80 hover:text-primary"
      >
        ← Voltar para eventos
      </Link>
      <h1 className="mt-4 font-serif text-3xl text-primary">Novo evento</h1>
      <p className="mt-2 text-sm text-foreground/80">
        Crie um novo evento. Marque “Publicar” para exibir já em /eventos.
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
          textoBotao="Criar evento"
          enviando={criar.isPending}
          onSubmit={async (dados) => {
            setErro(null);
            try {
              const novo = await criar.mutateAsync(dados);
              registrar({
                data: {
                  rota: "admin/eventos/criar",
                  motivo: `criou evento ${novo.id} (${novo.nomeEvento})`,
                },
              }).catch(() => undefined);
              navigate({ to: "/admin/eventos" });
            } catch (e) {
              setErro(e instanceof Error ? e.message : "Falha ao criar evento.");
            }
          }}
        />
      </div>
    </section>
  );
}
