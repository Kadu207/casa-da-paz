import { createFileRoute, getRouteApi, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  useEventos,
  useDefinirPublicado,
  useMoverEvento,
  useRemoverEvento,
  type Evento,
} from "@/lib/eventos-store";
import { formatEventoDate } from "@/data/eventos";
import { registrarAcaoAdmin } from "@/lib/auditoria.functions";

const parentRoute = getRouteApi("/_authenticated");

export const Route = createFileRoute("/_authenticated/admin/eventos")({
  head: () => ({
    meta: [
      { title: "Eventos — Painel Casa da Paz" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: AdminEventosPage,
});

function AdminEventosPage() {
  const { perfil } = parentRoute.useRouteContext();
  const isAdmin = perfil.papel === "admin";
  const { data: eventos, isLoading, error } = useEventos();
  const definirPublicado = useDefinirPublicado();
  const moverEvento = useMoverEvento();
  const removerEvento = useRemoverEvento();
  const registrar = useServerFn(registrarAcaoAdmin);
  const [erro, setErro] = useState<string | null>(null);
  const [confirmar, setConfirmar] = useState<string | null>(null);

  const auditar = (rota: string, motivo: string) =>
    registrar({ data: { rota, motivo } }).catch(() => undefined);

  const tratarErro = (e: unknown) => {
    if (e instanceof Error) setErro(e.message);
    else setErro("Falha inesperada.");
  };

  const lista = eventos ?? [];

  return (
    <section>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-primary/80">
            Painel da Casa
          </p>
          <h1 className="mt-2 font-serif text-3xl sm:text-4xl text-primary">
            Eventos
          </h1>
          <p className="mt-2 text-foreground/80 text-sm">
            {isAdmin
              ? "Crie, edite, publique e organize a ordem dos eventos exibidos em "
              : "Visualize a agenda da Casa. Somente administradores podem criar, editar ou publicar eventos. Página pública: "}
            <Link to="/eventos" className="text-primary hover:underline">
              /eventos
            </Link>
            .
          </p>
        </div>
        {isAdmin && (
          <Link
            to="/admin/eventos/novo"
            className="min-h-11 inline-flex items-center justify-center rounded-xl bg-primary text-primary-foreground font-medium px-5 py-2.5 hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background transition-colors"
          >
            + Novo evento
          </Link>
        )}
      </header>

      {(erro || error) && (
        <div
          role="alert"
          className="mt-4 rounded-xl border border-[color:var(--color-destructive)]/60 bg-[color:var(--color-destructive)]/10 text-[color:var(--color-destructive)] px-4 py-3 text-sm"
        >
          {erro ?? (error as Error)?.message}
        </div>
      )}

      <ul className="mt-6 space-y-3">
        {isLoading && (
          <li className="rounded-2xl border border-dashed border-border/60 bg-card/60 p-6 text-foreground/75 text-sm">
            Carregando eventos…
          </li>
        )}
        {!isLoading && lista.length === 0 && (
          <li className="rounded-2xl border border-dashed border-border/60 bg-card/60 p-6 text-foreground/75 text-sm">
            Nenhum evento cadastrado ainda.
          </li>
        )}
        {lista.map((ev, idx) => (
          <EventoCard
            key={ev.id}
            evento={ev}
            isAdmin={isAdmin}
            primeiro={idx === 0}
            ultimo={idx === lista.length - 1}
            confirmando={confirmar === ev.id}
            onPedirConfirmacao={() => setConfirmar(ev.id)}
            onCancelarConfirmacao={() => setConfirmar(null)}
            onRemover={async () => {
              setErro(null);
              try {
                await removerEvento.mutateAsync(ev.id);
                auditar("admin/eventos/remover", `removeu evento ${ev.id}`);
              } catch (e) {
                tratarErro(e);
              }
              setConfirmar(null);
            }}
            onTogglePublicado={async () => {
              setErro(null);
              try {
                const novo = !ev.publicado;
                await definirPublicado.mutateAsync({ slug: ev.id, publicado: novo });
                auditar(
                  "admin/eventos/publicar",
                  `${novo ? "publicou" : "despublicou"} evento ${ev.id}`,
                );
              } catch (e) {
                tratarErro(e);
              }
            }}
            onMover={async (direcao) => {
              setErro(null);
              try {
                await moverEvento.mutateAsync({ slug: ev.id, direcao });
                auditar(
                  "admin/eventos/mover",
                  `moveu evento ${ev.id} (${direcao === -1 ? "cima" : "baixo"})`,
                );
              } catch (e) {
                tratarErro(e);
              }
            }}
          />
        ))}
      </ul>
    </section>
  );
}

export function EventoCard({
  evento,
  isAdmin,
  primeiro,
  ultimo,
  confirmando,
  onPedirConfirmacao,
  onCancelarConfirmacao,
  onRemover,
  onTogglePublicado,
  onMover,
}: {
  evento: Evento;
  isAdmin: boolean;
  primeiro: boolean;
  ultimo: boolean;
  confirmando: boolean;
  onPedirConfirmacao: () => void;
  onCancelarConfirmacao: () => void;
  onRemover: () => void;
  onTogglePublicado: () => void;
  onMover: (d: -1 | 1) => void;
}) {
  return (
    <li className="rounded-2xl border border-border/60 bg-card p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-serif text-lg sm:text-xl text-primary truncate">
              {evento.nomeEvento}
            </h2>
            <span
              className={
                "text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border " +
                (evento.publicado
                  ? "border-primary/50 text-primary bg-primary/10"
                  : "border-border text-foreground/70 bg-background/40")
              }
            >
              {evento.publicado ? "Publicado" : "Rascunho"}
            </span>
          </div>
          <p className="mt-1 text-sm text-foreground/80 first-letter:uppercase">
            {formatEventoDate(evento.dataEvento)}
          </p>
          <p className="mt-1 text-xs text-foreground/65 truncate">
            {evento.local}
          </p>
        </div>

        {!isAdmin ? (
          <span className="text-xs text-foreground/60 italic">
            Somente leitura
          </span>
        ) : (
          <div
            className="flex flex-wrap items-center gap-2"
            data-testid="admin-evento-acoes"
          >
            <button
              type="button"
              onClick={() => onMover(-1)}
              disabled={primeiro}
              aria-label="Mover para cima"
              data-testid="admin-acao-mover-cima"
              className="min-h-9 min-w-9 inline-flex items-center justify-center rounded-lg border border-border px-2 text-sm hover:bg-primary/10 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              ↑
            </button>
            <button
              type="button"
              onClick={() => onMover(1)}
              disabled={ultimo}
              aria-label="Mover para baixo"
              data-testid="admin-acao-mover-baixo"
              className="min-h-9 min-w-9 inline-flex items-center justify-center rounded-lg border border-border px-2 text-sm hover:bg-primary/10 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              ↓
            </button>
            <button
              type="button"
              onClick={onTogglePublicado}
              data-testid="admin-acao-publicar"
              className="min-h-9 inline-flex items-center justify-center rounded-lg border border-border px-3 text-sm hover:bg-primary/10"
            >
              {evento.publicado ? "Despublicar" : "Publicar"}
            </button>
            <Link
              to="/admin/eventos/$eventoId"
              params={{ eventoId: evento.id }}
              data-testid="admin-acao-editar"
              className="min-h-9 inline-flex items-center justify-center rounded-lg border border-border px-3 text-sm hover:bg-primary/10"
            >
              Editar
            </Link>
            {confirmando ? (
              <span className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={onRemover}
                  className="min-h-9 inline-flex items-center justify-center rounded-lg border border-[color:var(--color-destructive)] text-[color:var(--color-destructive)] px-3 text-sm hover:bg-[color:var(--color-destructive)]/10"
                >
                  Confirmar
                </button>
                <button
                  type="button"
                  onClick={onCancelarConfirmacao}
                  className="min-h-9 inline-flex items-center justify-center rounded-lg border border-border px-3 text-sm hover:bg-primary/10"
                >
                  Cancelar
                </button>
              </span>
            ) : (
              <button
                type="button"
                onClick={onPedirConfirmacao}
                data-testid="admin-acao-excluir"
                className="min-h-9 inline-flex items-center justify-center rounded-lg border border-border px-3 text-sm hover:bg-[color:var(--color-destructive)]/10 hover:text-[color:var(--color-destructive)]"
              >
                Excluir
              </button>
            )}
          </div>
        )}
      </div>


    </li>
  );
}
