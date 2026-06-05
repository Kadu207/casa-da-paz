import { useState, type FormEvent } from "react";
import type { Evento } from "@/lib/eventos-store";

export type EventoFormDados = {
  id?: string;
  nomeEvento: string;
  dataEvento: string;
  local: string;
  resumo: string;
  descricao: string[];
  recomendacoes?: string[];
  capacidadeMax?: number;
  inscricoes?: number;
  publicado: boolean;
};

function toLocalInput(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function EventoForm({
  inicial,
  onSubmit,
  enviando,
  textoBotao = "Salvar",
}: {
  inicial?: Partial<Evento>;
  onSubmit: (dados: EventoFormDados) => void;
  enviando?: boolean;
  textoBotao?: string;
}) {
  const [nome, setNome] = useState(inicial?.nomeEvento ?? "");
  const [data, setData] = useState(toLocalInput(inicial?.dataEvento ?? ""));
  const [local, setLocal] = useState(
    inicial?.local ?? "Casa da Paz — Rua Valério Eugênio, 570, Areal",
  );
  const [resumo, setResumo] = useState(inicial?.resumo ?? "");
  const [descricao, setDescricao] = useState(
    (inicial?.descricao ?? []).join("\n\n"),
  );
  const [recomendacoes, setRecomendacoes] = useState(
    (inicial?.recomendacoes ?? []).join("\n"),
  );
  const [capacidade, setCapacidade] = useState<string>(
    inicial?.capacidadeMax != null ? String(inicial.capacidadeMax) : "",
  );
  const [inscricoes, setInscricoes] = useState<string>(
    inicial?.inscricoes != null ? String(inicial.inscricoes) : "",
  );
  const [publicado, setPublicado] = useState<boolean>(
    inicial?.publicado ?? false,
  );
  const [erro, setErro] = useState<string | null>(null);

  const submeter = (e: FormEvent) => {
    e.preventDefault();
    setErro(null);
    if (!nome.trim()) return setErro("Informe o nome do evento.");
    if (!data) return setErro("Informe a data e horário.");
    if (!local.trim()) return setErro("Informe o local.");
    const iso = new Date(data).toISOString();
    onSubmit({
      id: inicial?.id,
      nomeEvento: nome.trim(),
      dataEvento: iso,
      local: local.trim(),
      resumo: resumo.trim(),
      descricao: descricao
        .split(/\n\s*\n/)
        .map((s) => s.trim())
        .filter(Boolean),
      recomendacoes: recomendacoes
        .split(/\n/)
        .map((s) => s.trim())
        .filter(Boolean),
      capacidadeMax: capacidade ? Number(capacidade) : undefined,
      inscricoes: inscricoes ? Number(inscricoes) : undefined,
      publicado,
    });
  };

  const baseInput =
    "w-full min-h-11 px-3.5 py-2.5 rounded-xl border border-border bg-background/40 text-foreground placeholder:text-foreground/45 focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40";

  return (
    <form
      onSubmit={submeter}
      className="rounded-2xl bg-card border border-border/60 p-5 sm:p-6 space-y-4"
      noValidate
    >
      {erro && (
        <div
          role="alert"
          className="rounded-xl border border-[color:var(--color-destructive)]/60 bg-[color:var(--color-destructive)]/10 text-[color:var(--color-destructive)] px-4 py-3 text-sm"
        >
          {erro}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium mb-1.5" htmlFor="ev-nome">
          Nome do evento
        </label>
        <input
          id="ev-nome"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          className={baseInput}
          required
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium mb-1.5" htmlFor="ev-data">
            Data e horário
          </label>
          <input
            id="ev-data"
            type="datetime-local"
            value={data}
            onChange={(e) => setData(e.target.value)}
            className={baseInput}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5" htmlFor="ev-local">
            Local
          </label>
          <input
            id="ev-local"
            value={local}
            onChange={(e) => setLocal(e.target.value)}
            className={baseInput}
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5" htmlFor="ev-resumo">
          Resumo curto
        </label>
        <input
          id="ev-resumo"
          value={resumo}
          onChange={(e) => setResumo(e.target.value)}
          className={baseInput}
          placeholder="Uma frase que aparece na lista pública"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5" htmlFor="ev-desc">
          Descrição (separe parágrafos com linha em branco)
        </label>
        <textarea
          id="ev-desc"
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          rows={6}
          className={baseInput + " min-h-32"}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5" htmlFor="ev-rec">
          Recomendações (uma por linha)
        </label>
        <textarea
          id="ev-rec"
          value={recomendacoes}
          onChange={(e) => setRecomendacoes(e.target.value)}
          rows={4}
          className={baseInput + " min-h-24"}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium mb-1.5" htmlFor="ev-cap">
            Capacidade máxima
          </label>
          <input
            id="ev-cap"
            type="number"
            min={0}
            value={capacidade}
            onChange={(e) => setCapacidade(e.target.value)}
            className={baseInput}
            placeholder="Opcional"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5" htmlFor="ev-ins">
            Inscritos atuais
          </label>
          <input
            id="ev-ins"
            type="number"
            min={0}
            value={inscricoes}
            onChange={(e) => setInscricoes(e.target.value)}
            className={baseInput}
            placeholder="Opcional"
          />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={publicado}
          onChange={(e) => setPublicado(e.target.checked)}
          className="h-4 w-4 accent-[color:var(--color-primary)]"
        />
        Publicar (exibir em /eventos)
      </label>

      <div className="pt-2">
        <button
          type="submit"
          disabled={enviando}
          className="min-h-11 inline-flex items-center justify-center rounded-xl bg-primary text-primary-foreground font-medium px-5 py-2.5 hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-card transition-colors disabled:opacity-60"
        >
          {enviando ? "Salvando…" : textoBotao}
        </button>
      </div>
    </form>
  );
}
