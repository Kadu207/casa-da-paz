import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PublicLayout } from "@/components/PublicLayout";
import { RouteErrorFallback, RouteNotFoundFallback } from "@/components/RouteFallbacks";
import { Turnstile } from "@/components/Turnstile";
import bannerNature from "@/assets/banner-nature.jpg";
import {
  agendarSchema,
  MIN_FORM_FILL_MS,
  type AgendarFormData,
} from "@/lib/agendar-schema";

export const Route = createFileRoute("/agendar")({
  head: () => ({
    meta: [
      { title: "Agendar consulta — Casa da Paz" },
      {
        name: "description",
        content:
          "Solicite seu horário de consulta espiritual na Casa da Paz. Atendimento acolhedor e respeitoso.",
      },
      { property: "og:title", content: "Agendar consulta — Casa da Paz" },
      {
        property: "og:description",
        content: "Solicite seu horário de consulta espiritual.",
      },
      { property: "og:url", content: "/agendar" },
    ],
    links: [{ rel: "canonical", href: "/agendar" }],
  }),
  component: AgendarPage,
  errorComponent: RouteErrorFallback,
  notFoundComponent: RouteNotFoundFallback,
});

type FormData = AgendarFormData;

type SubmittedSummary = {
  protocolo: string;
  nome: string;
  telefone: string;
  dataPreferida: string;
  observacao?: string;
};

function AgendarPage() {
  const [summary, setSummary] = useState<SubmittedSummary | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const mountedAt = useRef<number>(typeof window !== "undefined" ? Date.now() : 0);
  const submittingRef = useRef(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(agendarSchema),
    mode: "onTouched",
    defaultValues: {
      nome: "",
      telefone: "",
      dataPreferida: "",
      observacao: "",
      website: "",
      turnstileToken: "",
    },
  });

  // Registra turnstileToken como campo controlado pelo widget.
  register("turnstileToken");

  const handleTurnstileToken = useCallback(
    (token: string | null) => {
      setValue("turnstileToken", token ?? "", { shouldValidate: !!token });
      if (token) void trigger("turnstileToken");
    },
    [setValue, trigger],
  );

  const onSubmit = async (data: FormData) => {
    if (submittingRef.current) return;
    submittingRef.current = true;

    try {
      setSubmitError(null);

      // Honeypot
      if (data.website && data.website.length > 0) {
        console.warn("honeypot acionado");
        reset();
        return;
      }

      // Tempo mínimo de preenchimento
      const elapsed = Date.now() - mountedAt.current;
      if (elapsed < MIN_FORM_FILL_MS) {
        setSubmitError("Aguarde um instante antes de enviar e tente novamente.");
        return;
      }

      // Envia ao endpoint público (rate-limit por IP + verifica Turnstile)
      const res = await fetch("/api/public/agendamentos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: data.nome,
          telefone: data.telefone,
          dataPreferida: data.dataPreferida,
          observacao: data.observacao ?? "",
          website: data.website ?? "",
          turnstileToken: data.turnstileToken,
        }),
      });

      const payload = (await res.json().catch(() => ({}))) as {
        protocolo?: string;
        message?: string;
        error?: string;
        retryAfterSec?: number;
      };

      if (res.status === 429) {
        setSubmitError(
          payload.message ??
            `Muitas tentativas. Tente novamente em ${payload.retryAfterSec ?? 60}s.`,
        );
        return;
      }
      if (!res.ok || !payload.protocolo) {
        setSubmitError(
          payload.message ??
            "Não foi possível enviar agora. Tente novamente em instantes ou fale conosco pelo WhatsApp.",
        );
        return;
      }

      setSummary({
        protocolo: payload.protocolo,
        nome: data.nome,
        telefone: data.telefone,
        dataPreferida: data.dataPreferida,
        observacao: data.observacao || undefined,
      });
      mountedAt.current = Date.now();
      reset();
    } catch (err) {
      console.error(err);
      setSubmitError(
        "Não foi possível enviar agora. Tente novamente em instantes ou fale conosco pelo WhatsApp.",
      );
    } finally {
      submittingRef.current = false;
    }
  };



  const today = new Date().toISOString().split("T")[0];

  return (
    <PublicLayout>
      <section className="relative h-36 sm:h-44 overflow-hidden">
        <img
          src={bannerNature}
          alt=""
          width={1536}
          height={768}
          loading="lazy"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/60 to-background" />
        <div className="absolute inset-0 flex items-end">
          <div className="max-w-3xl mx-auto w-full px-4 pb-5">
            <h1 className="font-serif text-3xl sm:text-4xl text-primary">
              Agendar consulta
            </h1>
            <p className="text-foreground/70 text-sm mt-1">
              Preencha seus dados e nossa recepção retorna o contato
            </p>
          </div>
        </div>
      </section>

      <section className="max-w-xl mx-auto px-4 py-8">
        {summary ? (
          <div
            role="status"
            aria-live="polite"
            className="rounded-2xl border border-[color:var(--color-success)]/40 bg-card p-6 sm:p-8"
          >
            <div className="text-center">
              <div className="mx-auto h-12 w-12 rounded-full bg-[color:var(--color-success)]/20 flex items-center justify-center text-[color:var(--color-success)] text-2xl">
                ✓
              </div>
              <h2 className="font-serif text-2xl text-primary mt-4">
                Pedido recebido
              </h2>
              <p className="text-foreground/80 mt-2">
                Axé, {summary.nome.split(" ")[0]}! Recebemos sua solicitação.
              </p>
              <p className="mt-2 text-sm text-foreground/75">
                Protocolo de acompanhamento:
              </p>
              <p className="mt-1 font-mono text-lg text-primary tracking-wider">
                {summary.protocolo}
              </p>
            </div>

            <dl className="mt-6 rounded-xl border border-border/60 bg-background/40 p-4 text-sm space-y-2">
              <div className="flex justify-between gap-3">
                <dt className="text-foreground/70">Nome</dt>
                <dd className="text-foreground text-right">{summary.nome}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-foreground/70">Telefone</dt>
                <dd className="text-foreground text-right">{summary.telefone}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-foreground/70">Data preferida</dt>
                <dd className="text-foreground text-right">
                  {new Date(summary.dataPreferida + "T00:00:00").toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })}
                </dd>
              </div>
              {summary.observacao && (
                <div className="pt-2 border-t border-border/60">
                  <dt className="text-foreground/70 mb-1">Observação</dt>
                  <dd className="text-foreground whitespace-pre-wrap">
                    {summary.observacao}
                  </dd>
                </div>
              )}
            </dl>

            <div className="mt-6 rounded-xl bg-background/40 border border-border/60 p-4 text-sm text-foreground/85">
              <p className="font-medium text-foreground mb-1">Como acompanhar:</p>
              <ol className="list-decimal pl-5 space-y-1">
                <li>Anote o número de protocolo acima.</li>
                <li>Em até 2 dias úteis, a recepção entra em contato pelo WhatsApp.</li>
                <li>Precisa antecipar? Fale com a Casa citando o protocolo.</li>
              </ol>
            </div>

            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <a
                href={`https://wa.me/5531900000000?text=${encodeURIComponent(
                  `Olá! Quero acompanhar meu agendamento. Protocolo: ${summary.protocolo}`,
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 min-h-11 inline-flex items-center justify-center rounded-xl bg-primary text-primary-foreground font-medium px-5 py-2.5 hover:bg-primary/90 transition-colors"
              >
                Falar no WhatsApp
              </a>
              <button
                type="button"
                onClick={() => setSummary(null)}
                className="flex-1 min-h-11 inline-flex items-center justify-center rounded-xl border border-primary text-primary font-medium px-5 py-2.5 hover:bg-primary/10 transition-colors"
              >
                Fazer outro agendamento
              </button>
            </div>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="rounded-2xl bg-card border border-border/60 p-6 sm:p-8 shadow-lg space-y-5"
            noValidate
            aria-describedby="form-hint"
          >
            {/* Honeypot anti-spam — invisível para humanos, irresistível para bots */}
            <div aria-hidden="true" className="hidden" style={{ position: "absolute", left: "-10000px" }}>
              <label htmlFor="website">Site (não preencher)</label>
              <input
                id="website"
                type="text"
                tabIndex={-1}
                autoComplete="off"
                {...register("website")}
              />
            </div>

            {submitError && (
              <div
                role="alert"
                className="rounded-xl border border-[color:var(--color-destructive)]/50 bg-[color:var(--color-destructive)]/10 p-4 text-sm text-foreground"
              >
                {submitError}
              </div>
            )}

            <Field id="nome" label="Nome completo" error={errors.nome?.message} required>
              <input
                id="nome"
                type="text"
                autoComplete="name"
                aria-required="true"
                aria-invalid={!!errors.nome}
                aria-describedby={errors.nome ? "nome-error" : undefined}
                {...register("nome")}
                className="input"
                placeholder="Seu nome"
              />
            </Field>

            <Field
              id="telefone"
              label="Telefone (WhatsApp)"
              error={errors.telefone?.message}
              required
            >
              <input
                id="telefone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                aria-required="true"
                aria-invalid={!!errors.telefone}
                aria-describedby={errors.telefone ? "telefone-error" : undefined}
                {...register("telefone")}
                className="input"
                placeholder="(31) 9 0000-0000"
              />
            </Field>

            <Field
              id="dataPreferida"
              label="Data preferida"
              error={errors.dataPreferida?.message}
              required
            >
              <input
                id="dataPreferida"
                type="date"
                min={today}
                aria-required="true"
                aria-invalid={!!errors.dataPreferida}
                aria-describedby={errors.dataPreferida ? "dataPreferida-error" : undefined}
                {...register("dataPreferida")}
                className="input"
              />
            </Field>

            <Field
              id="observacao"
              label="Observação (opcional)"
              error={errors.observacao?.message}
            >
              <textarea
                id="observacao"
                rows={4}
                maxLength={500}
                aria-invalid={!!errors.observacao}
                aria-describedby={errors.observacao ? "observacao-error" : undefined}
                {...register("observacao")}
                className="input resize-none"
                placeholder="Conte brevemente o motivo do seu pedido"
              />
            </Field>

            <div>
              <p className="block text-sm font-medium text-foreground mb-1.5">
                Verificação anti-spam
                <span aria-hidden="true" className="text-[color:var(--color-destructive)] ml-0.5">
                  *
                </span>
              </p>
              <Turnstile onToken={handleTurnstileToken} />
              {errors.turnstileToken && (
                <p
                  role="alert"
                  className="mt-1.5 text-sm text-[color:var(--color-destructive)]"
                >
                  {errors.turnstileToken.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full min-h-12 inline-flex items-center justify-center rounded-xl bg-primary text-primary-foreground font-medium px-6 py-3 hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-card transition-colors disabled:opacity-60 disabled:cursor-not-allowed shadow"
            >
              {isSubmitting ? "Enviando..." : "Enviar pedido"}
            </button>
            <p id="form-hint" className="text-xs text-foreground/70 text-center">
              Campos com * são obrigatórios. Seus dados são usados apenas para
              contato da Casa da Paz.
            </p>
          </form>
        )}
      </section>

      <style>{`
        .input {
          width: 100%;
          min-height: 44px;
          padding: 0.625rem 0.875rem;
          background: color-mix(in oklab, var(--color-background) 60%, transparent);
          border: 1px solid var(--color-border);
          border-radius: 0.625rem;
          color: var(--color-foreground);
          font: inherit;
          outline: none;
          transition: border-color .15s, box-shadow .15s;
        }
        .input::placeholder { color: color-mix(in oklab, var(--color-foreground) 40%, transparent); }
        .input:focus {
          border-color: var(--color-primary);
          box-shadow: 0 0 0 3px color-mix(in oklab, var(--color-primary) 25%, transparent);
        }
      `}</style>
    </PublicLayout>
  );
}

function Field({
  id,
  label,
  error,
  required,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="block text-sm font-medium text-foreground mb-1.5"
      >
        {label}
        {required && (
          <span aria-hidden="true" className="text-[color:var(--color-destructive)] ml-0.5">
            *
          </span>
        )}
      </label>
      {children}
      {error && (
        <p
          id={`${id}-error`}
          role="alert"
          className="mt-1.5 text-sm text-[color:var(--color-destructive)]"
        >
          {error}
        </p>
      )}
    </div>
  );
}
