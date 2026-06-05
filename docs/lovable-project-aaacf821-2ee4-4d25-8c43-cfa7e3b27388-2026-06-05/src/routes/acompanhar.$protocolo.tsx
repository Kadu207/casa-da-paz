import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { PublicLayout } from "@/components/PublicLayout";
import {
  RouteErrorFallback,
  RouteNotFoundFallback,
} from "@/components/RouteFallbacks";
import { downloadIcs } from "@/lib/ics";

const PROTOCOLO_REGEX = /^CDP-[A-Z0-9]+-[A-Z0-9]+$/i;

/**
 * Gera um ISO local em America/Sao_Paulo (sem sufixo Z) para
 * "daqui a N dias às 09:00", usado como lembrete no .ics.
 */
function lembreteIsoSaoPaulo(diasAFrente: number, hora = 9): string {
  // "Agora" em São Paulo, independentemente do fuso do dispositivo.
  const agoraSP = new Date(
    new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }),
  );
  agoraSP.setDate(agoraSP.getDate() + diasAFrente);
  const y = agoraSP.getFullYear();
  const mo = String(agoraSP.getMonth() + 1).padStart(2, "0");
  const d = String(agoraSP.getDate()).padStart(2, "0");
  const h = String(hora).padStart(2, "0");
  return `${y}-${mo}-${d}T${h}:00:00`;
}

export const Route = createFileRoute("/acompanhar/$protocolo")({
  head: ({ params }) => ({
    meta: [
      { title: `Acompanhar agendamento ${params.protocolo} — Casa da Paz` },
      {
        name: "description",
        content:
          "Acompanhe o status do seu agendamento na Casa da Paz pelo número de protocolo.",
      },
      { name: "robots", content: "noindex,follow" },
    ],
  }),
  component: AcompanharProtocoloPage,
  errorComponent: RouteErrorFallback,
  notFoundComponent: RouteNotFoundFallback,
});

function AcompanharProtocoloPage() {
  const { protocolo } = Route.useParams();
  const formatoValido = PROTOCOLO_REGEX.test(protocolo);
  const navigate = useNavigate();
  const [busca, setBusca] = useState(protocolo);

  const whatsapp = `https://wa.me/5531900000000?text=${encodeURIComponent(
    `Olá! Quero acompanhar meu agendamento. Protocolo: ${protocolo}`,
  )}`;

  const baixarLembrete = () => {
    downloadIcs(
      {
        uid: `acompanhar-${protocolo.toLowerCase()}`,
        title: `Acompanhar agendamento ${protocolo} — Casa da Paz`,
        description: `Lembrete para verificar o status do agendamento ${protocolo}. Se ainda não tiver retorno, fale com a recepção pelo WhatsApp citando o protocolo.\\n\\nStatus: https://casa-da-paz.lovable.app/acompanhar/${protocolo}`,
        location: "Casa da Paz",
        start: lembreteIsoSaoPaulo(2, 9),
        durationMinutes: 30,
        url: `https://casa-da-paz.lovable.app/acompanhar/${protocolo}`,
      },
      `acompanhar-${protocolo}.ics`,
    );
  };

  return (
    <PublicLayout>
      <section className="max-w-2xl mx-auto px-4 py-8 sm:py-12">
        <Link
          to="/agendar"
          className="text-sm text-foreground/80 hover:text-primary focus-visible:text-primary"
        >
          ← Voltar para agendar
        </Link>

        <header className="mt-4">
          <p className="text-xs sm:text-sm uppercase tracking-[0.2em] text-primary/85">
            Acompanhamento
          </p>
          <h1 className="mt-2 font-serif text-3xl sm:text-4xl text-primary">
            Protocolo {protocolo}
          </h1>
        </header>

        {!formatoValido ? (
          <div
            role="alert"
            className="mt-6 rounded-2xl border border-[color:var(--color-destructive)]/50 bg-card p-5 sm:p-6"
          >
            <h2 className="font-serif text-xl text-primary">
              Protocolo inválido
            </h2>
            <p className="mt-2 text-foreground/85 text-sm">
              O formato esperado é <code>CDP-XXXX-XXXX</code>. Confira o número
              recebido após o envio do formulário.
            </p>
          </div>
        ) : (
          <>
            <div className="mt-6 rounded-2xl bg-card border border-border/60 p-5 sm:p-6">
              <p className="text-xs uppercase tracking-wider text-foreground/70">
                Status
              </p>
              <p className="mt-1 inline-flex items-center gap-2 text-primary font-medium">
                <span
                  aria-hidden="true"
                  className="h-2.5 w-2.5 rounded-full bg-[color:var(--color-success)]"
                />
                Pedido recebido — aguardando contato da Casa
              </p>
              <p className="mt-3 text-sm text-foreground/80">
                Em até 2 dias úteis, nossa recepção retorna pelo WhatsApp
                informado no formulário para confirmar dia e horário.
              </p>
            </div>

            <ol className="mt-6 space-y-3">
              {[
                {
                  t: "Recebido",
                  d: "Seu pedido foi registrado e está na fila da recepção.",
                  ativo: true,
                },
                {
                  t: "Em contato",
                  d: "A Casa entra em contato pelo WhatsApp para confirmar.",
                  ativo: false,
                },
                {
                  t: "Confirmado",
                  d: "Data e horário acertados.",
                  ativo: false,
                },
                {
                  t: "Concluído",
                  d: "Atendimento realizado.",
                  ativo: false,
                },
              ].map((etapa) => (
                <li
                  key={etapa.t}
                  className={`flex gap-3 rounded-xl border p-4 ${
                    etapa.ativo
                      ? "border-primary/60 bg-primary/5"
                      : "border-border/60 bg-card"
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${
                      etapa.ativo ? "bg-primary" : "bg-foreground/25"
                    }`}
                  />
                  <div>
                    <p
                      className={`font-medium ${
                        etapa.ativo ? "text-primary" : "text-foreground"
                      }`}
                    >
                      {etapa.t}
                    </p>
                    <p className="text-sm text-foreground/80">{etapa.d}</p>
                  </div>
                </li>
              ))}
            </ol>

            <div className="mt-6 rounded-2xl bg-card border border-border/60 p-5 sm:p-6">
              <h2 className="font-serif text-xl text-primary">
                Precisa de ajuda?
              </h2>
              <p className="mt-2 text-foreground/85 text-sm">
                Fale com a recepção pelo WhatsApp citando seu protocolo ou
                adicione um lembrete no seu calendário para acompanhar o status.
              </p>
              <div className="mt-4 flex flex-col sm:flex-row gap-2">
                <a
                  href={whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-11 items-center justify-center rounded-xl bg-primary text-primary-foreground font-medium px-5 py-2.5 hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-card transition-colors"
                >
                  Falar no WhatsApp
                </a>
                <button
                  type="button"
                  onClick={baixarLembrete}
                  className="inline-flex min-h-11 items-center justify-center rounded-xl border border-primary/60 text-primary font-medium px-5 py-2.5 hover:bg-primary/10 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-card transition-colors"
                >
                  Adicionar lembrete ao calendário (.ics)
                </button>
              </div>
              <p className="mt-2 text-xs text-foreground/65">
                O lembrete é gerado no fuso America/Sao_Paulo, para que o
                horário não mude no seu calendário.
              </p>
            </div>
          </>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            const v = busca.trim().toUpperCase();
            if (PROTOCOLO_REGEX.test(v)) {
              navigate({ to: "/acompanhar/$protocolo", params: { protocolo: v } });
            }
          }}
          className="mt-8 rounded-2xl bg-card border border-border/60 p-5 sm:p-6"
        >
          <label
            htmlFor="protocolo"
            className="block text-sm font-medium text-foreground mb-1.5"
          >
            Consultar outro protocolo
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              id="protocolo"
              type="text"
              autoComplete="off"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="CDP-XXXX-XXXX"
              className="flex-1 min-h-11 px-3.5 py-2.5 rounded-xl border border-border bg-background/40 text-foreground placeholder:text-foreground/45 focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            />
            <button
              type="submit"
              className="min-h-11 inline-flex items-center justify-center rounded-xl bg-primary text-primary-foreground font-medium px-5 py-2.5 hover:bg-primary/90 transition-colors"
            >
              Consultar
            </button>
          </div>
          <p className="mt-2 text-xs text-foreground/65">
            Esta página exibe instruções gerais por protocolo. O status real é
            confirmado pela Casa via WhatsApp.
          </p>
        </form>
      </section>
    </PublicLayout>
  );
}
