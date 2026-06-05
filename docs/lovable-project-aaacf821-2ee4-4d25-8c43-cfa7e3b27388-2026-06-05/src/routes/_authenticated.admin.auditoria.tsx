import { createFileRoute, getRouteApi, redirect } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  listarAuditoria,
  exportarAuditoriaCsv,
  type AuditoriaItem,
  type ColunaOrdenacao,
} from "@/lib/auditoria.functions";

const parentRoute = getRouteApi("/_authenticated");

export const Route = createFileRoute("/_authenticated/admin/auditoria")({
  beforeLoad: ({ context }) => {
    const ctx = context as { perfil?: { papel?: string } };
    if (ctx.perfil?.papel !== "admin") {
      throw redirect({ to: "/acesso-negado" });
    }
  },
  head: () => ({
    meta: [
      { title: "Auditoria — Painel Casa da Paz" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: AuditoriaPage,
});

type Filtros = {
  papel: "" | "admin" | "atendente" | "nenhum";
  rota: string;
  q: string;
  ordem: "desc" | "asc";
  ordenarPor: ColunaOrdenacao;
  page: number;
  pageSize: number;
};

const FILTROS_INICIAIS: Filtros = {
  papel: "",
  rota: "",
  q: "",
  ordem: "desc",
  ordenarPor: "data",
  page: 1,
  pageSize: 25,
};

function AuditoriaPage() {
  const { perfil } = parentRoute.useRouteContext();
  const [filtros, setFiltros] = useState<Filtros>(FILTROS_INICIAIS);
  const [erroExport, setErroExport] = useState<string | null>(null);
  const [exportando, setExportando] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const listar = useServerFn(listarAuditoria);
  const exportarCsv = useServerFn(exportarAuditoriaCsv);

  const params = useMemo(
    () => ({
      papel: filtros.papel || null,
      rota: filtros.rota || null,
      q: filtros.q || null,
      ordem: filtros.ordem,
      ordenarPor: filtros.ordenarPor,
      page: filtros.page,
      pageSize: filtros.pageSize,
    }),
    [filtros],
  );

  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ["auditoria", params],
    queryFn: () => listar({ data: params }),
    placeholderData: keepPreviousData,
  });

  const total = data?.total ?? 0;
  const itens = data?.itens ?? [];
  const totalPaginas = Math.max(1, Math.ceil(total / filtros.pageSize));

  function atualizar<K extends keyof Filtros>(chave: K, valor: Filtros[K]) {
    setFiltros((f) => ({
      ...f,
      [chave]: valor,
      page: chave === "page" ? (valor as number) : 1,
    }));
    if (chave !== "page") setFeedback("Filtros atualizados");
  }

  function limpar() {
    setFiltros(FILTROS_INICIAIS);
    setFeedback("Filtros limpos");
  }

  function alternarOrdenacao(coluna: ColunaOrdenacao) {
    setFiltros((f) => ({
      ...f,
      ordenarPor: coluna,
      ordem: f.ordenarPor === coluna && f.ordem === "desc" ? "asc" : "desc",
      page: 1,
    }));
    setFeedback(`Ordenando por ${rotuloColuna(coluna)}`);
  }

  async function baixarCsv() {
    setErroExport(null);
    setExportando(true);
    try {
      const { csv, total } = await exportarCsv({ data: params });
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `auditoria-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setFeedback(`CSV exportado com ${total} registro${total === 1 ? "" : "s"}.`);
    } catch (e) {
      setErroExport(e instanceof Error ? e.message : "Falha ao exportar.");
    } finally {
      setExportando(false);
    }
  }

  function imprimirPdf() {
    window.print();
  }

  if (perfil.papel !== "admin") return null;

  return (
    <section className="auditoria-pagina">
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          .auditoria-imprimivel, .auditoria-imprimivel * { visibility: visible !important; }
          .auditoria-imprimivel { position: absolute; inset: 0; padding: 16px; }
          .nao-imprimir { display: none !important; }
        }
      `}</style>

      <header className="flex flex-wrap items-end justify-between gap-4 nao-imprimir">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-primary/80">
            Painel da Casa · Segurança
          </p>
          <h1 className="mt-2 font-serif text-3xl sm:text-4xl text-primary">
            Auditoria de acesso
          </h1>
          <p className="mt-2 text-foreground/80 text-sm">
            Registro de tentativas negadas e ações administrativas relevantes
            (exportações, alterações em eventos e usuários).
          </p>
        </div>
      </header>

      {/* Filtros */}
      <form
        className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 nao-imprimir"
        onSubmit={(e) => {
          e.preventDefault();
          setFeedback("Filtros aplicados");
          refetch();
        }}
      >
        <label className="text-sm">
          <span className="block text-foreground/75 mb-1">Papel</span>
          <select
            value={filtros.papel}
            onChange={(e) => atualizar("papel", e.target.value as Filtros["papel"])}
            className="w-full min-h-10 rounded-lg border border-border bg-background px-3 text-sm"
          >
            <option value="">Todos</option>
            <option value="admin">admin</option>
            <option value="atendente">atendente</option>
            <option value="nenhum">nenhum</option>
          </select>
        </label>

        <label className="text-sm">
          <span className="block text-foreground/75 mb-1">Rota / endpoint</span>
          <input
            type="text"
            value={filtros.rota}
            onChange={(e) => atualizar("rota", e.target.value)}
            placeholder="ex.: listarUsuarios"
            className="w-full min-h-10 rounded-lg border border-border bg-background px-3 text-sm"
          />
        </label>

        <label className="text-sm">
          <span className="block text-foreground/75 mb-1">
            Usuário (e-mail, nome ou ID)
          </span>
          <input
            type="text"
            value={filtros.q}
            onChange={(e) => atualizar("q", e.target.value)}
            placeholder="ex.: maria@..."
            className="w-full min-h-10 rounded-lg border border-border bg-background px-3 text-sm"
          />
        </label>

        <label className="text-sm">
          <span className="block text-foreground/75 mb-1">Ordenar por</span>
          <div className="flex gap-2">
            <select
              value={filtros.ordenarPor}
              onChange={(e) =>
                atualizar("ordenarPor", e.target.value as ColunaOrdenacao)
              }
              className="flex-1 min-h-10 rounded-lg border border-border bg-background px-3 text-sm"
            >
              <option value="data">Data</option>
              <option value="usuario">Usuário</option>
              <option value="papel">Papel</option>
              <option value="rota">Rota</option>
            </select>
            <select
              value={filtros.ordem}
              onChange={(e) => atualizar("ordem", e.target.value as Filtros["ordem"])}
              className="min-h-10 rounded-lg border border-border bg-background px-2 text-sm"
              aria-label="Direção da ordenação"
            >
              <option value="desc">↓</option>
              <option value="asc">↑</option>
            </select>
          </div>
        </label>

        <div className="sm:col-span-2 lg:col-span-4 flex flex-wrap gap-2">
          <button
            type="submit"
            className="min-h-10 inline-flex items-center justify-center rounded-lg bg-primary text-primary-foreground px-4 text-sm hover:bg-primary/90"
          >
            Aplicar filtros
          </button>
          <button
            type="button"
            onClick={limpar}
            className="min-h-10 inline-flex items-center justify-center rounded-lg border border-border px-4 text-sm hover:bg-primary/10"
          >
            Limpar
          </button>
          <span className="flex-1" />
          <button
            type="button"
            onClick={baixarCsv}
            disabled={exportando}
            className="min-h-10 inline-flex items-center justify-center rounded-lg border border-border px-4 text-sm hover:bg-primary/10 disabled:opacity-60"
          >
            {exportando ? "Exportando…" : "Exportar CSV"}
          </button>
          <button
            type="button"
            onClick={imprimirPdf}
            className="min-h-10 inline-flex items-center justify-center rounded-lg border border-border px-4 text-sm hover:bg-primary/10"
          >
            Salvar como PDF
          </button>
        </div>
      </form>

      <div className="sr-only" role="status" aria-live="polite">
        {feedback ?? ""}
      </div>

      {(error || erroExport) && (
        <div
          role="alert"
          className="mt-4 rounded-xl border border-[color:var(--color-destructive)]/60 bg-[color:var(--color-destructive)]/10 text-[color:var(--color-destructive)] px-4 py-3 text-sm nao-imprimir"
        >
          {erroExport ?? (error as Error)?.message}
        </div>
      )}

      <div className="auditoria-imprimivel mt-6 overflow-x-auto rounded-2xl border border-border/60 bg-card">
        <table className="w-full text-sm">
          <caption className="sr-only">
            Registro de tentativas negadas de acesso ao painel e ações administrativas.
          </caption>
          <thead className="bg-background/40 text-foreground/75">
            <tr>
              <ThSort
                coluna="data"
                atual={filtros.ordenarPor}
                ordem={filtros.ordem}
                onClick={alternarOrdenacao}
              >
                Data
              </ThSort>
              <ThSort
                coluna="usuario"
                atual={filtros.ordenarPor}
                ordem={filtros.ordem}
                onClick={alternarOrdenacao}
              >
                Usuário
              </ThSort>
              <ThSort
                coluna="papel"
                atual={filtros.ordenarPor}
                ordem={filtros.ordem}
                onClick={alternarOrdenacao}
              >
                Papel
              </ThSort>
              <ThSort
                coluna="rota"
                atual={filtros.ordenarPor}
                ordem={filtros.ordem}
                onClick={alternarOrdenacao}
              >
                Rota
              </ThSort>
              <Th>Motivo</Th>
              <Th className="hidden md:table-cell">IP</Th>
            </tr>
          </thead>
          <tbody>
            {isLoading &&
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={`sk-${i}`} className="border-b border-border/30">
                  {Array.from({ length: 6 }).map((__, j) => (
                    <td key={j} className="px-3 py-3">
                      <div className="h-3 rounded bg-primary/10 animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))}
            {!isLoading && itens.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center">
                  <p className="font-serif text-lg text-primary">
                    Nenhum registro encontrado
                  </p>
                  <p className="mt-1 text-sm text-foreground/70">
                    {filtros.papel || filtros.rota || filtros.q
                      ? "Ajuste ou limpe os filtros para ampliar a busca."
                      : "Sem tentativas negadas nem ações registradas até o momento."}
                  </p>
                </td>
              </tr>
            )}
            {itens.map((it) => (
              <Linha key={it.id} item={it} />
            ))}
          </tbody>
        </table>
      </div>

      {/* Paginação */}
      <nav
        aria-label="Paginação"
        className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm nao-imprimir"
      >
        <p className="text-foreground/70" aria-live="polite">
          {total === 0
            ? "0 registros"
            : `Página ${filtros.page} de ${totalPaginas} · ${total} registro${total === 1 ? "" : "s"}`}
          {isFetching && !isLoading && " · atualizando…"}
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              const proxima = Math.max(1, filtros.page - 1);
              atualizar("page", proxima);
              setFeedback(`Página ${proxima}`);
            }}
            disabled={filtros.page <= 1 || isFetching}
            className="min-h-9 inline-flex items-center justify-center rounded-lg border border-border px-3 hover:bg-primary/10 disabled:opacity-50"
          >
            ← Anterior
          </button>
          <button
            type="button"
            onClick={() => {
              const proxima = Math.min(totalPaginas, filtros.page + 1);
              atualizar("page", proxima);
              setFeedback(`Página ${proxima}`);
            }}
            disabled={filtros.page >= totalPaginas || isFetching}
            className="min-h-9 inline-flex items-center justify-center rounded-lg border border-border px-3 hover:bg-primary/10 disabled:opacity-50"
          >
            Próxima →
          </button>
          <label className="ml-2 flex items-center gap-1">
            <span className="text-foreground/70">Por página:</span>
            <select
              value={filtros.pageSize}
              onChange={(e) => {
                setFiltros((f) => ({
                  ...f,
                  pageSize: Number(e.target.value),
                  page: 1,
                }));
                setFeedback(`${e.target.value} registros por página`);
              }}
              className="min-h-9 rounded-lg border border-border bg-background px-2"
            >
              {[10, 25, 50, 100].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
        </div>
      </nav>
    </section>
  );
}

function rotuloColuna(c: ColunaOrdenacao): string {
  switch (c) {
    case "data": return "data";
    case "usuario": return "usuário";
    case "papel": return "papel";
    case "rota": return "rota";
  }
}

function Th({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <th
      className={
        "text-left font-medium uppercase text-xs tracking-wider px-3 py-2 border-b border-border/60 " +
        className
      }
    >
      {children}
    </th>
  );
}

function ThSort({
  coluna,
  atual,
  ordem,
  onClick,
  children,
}: {
  coluna: ColunaOrdenacao;
  atual: ColunaOrdenacao;
  ordem: "asc" | "desc";
  onClick: (c: ColunaOrdenacao) => void;
  children: React.ReactNode;
}) {
  const ativo = atual === coluna;
  const seta = ativo ? (ordem === "asc" ? "↑" : "↓") : "↕";
  const ariaSort = ativo ? (ordem === "asc" ? "ascending" : "descending") : "none";
  return (
    <th
      aria-sort={ariaSort as "ascending" | "descending" | "none"}
      className="text-left font-medium uppercase text-xs tracking-wider px-3 py-2 border-b border-border/60"
    >
      <button
        type="button"
        onClick={() => onClick(coluna)}
        className={
          "inline-flex items-center gap-1 hover:text-primary " +
          (ativo ? "text-primary" : "")
        }
      >
        {children}
        <span aria-hidden="true" className="text-[0.65rem]">{seta}</span>
      </button>
    </th>
  );
}

function Linha({ item }: { item: AuditoriaItem }) {
  const data = new Date(item.criadoEm);
  return (
    <tr className="border-b border-border/40 last:border-b-0 align-top">
      <td className="px-3 py-2 whitespace-nowrap">
        <time dateTime={item.criadoEm}>
          {data.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}
        </time>
      </td>
      <td className="px-3 py-2 min-w-0">
        {item.email || item.nome ? (
          <div className="min-w-0">
            <div className="truncate">{item.nome || "—"}</div>
            <div className="text-xs text-foreground/65 truncate">
              {item.email ?? "—"}
            </div>
          </div>
        ) : (
          <span className="text-foreground/65">
            {item.userId ?? "anônimo"}
          </span>
        )}
      </td>
      <td className="px-3 py-2">
        <span className="inline-flex items-center rounded-full border border-border px-2 py-0.5 text-xs uppercase tracking-wider">
          {item.papel ?? "—"}
        </span>
      </td>
      <td className="px-3 py-2 font-mono text-xs">{item.rota}</td>
      <td className="px-3 py-2">{item.motivo}</td>
      <td className="px-3 py-2 hidden md:table-cell text-xs text-foreground/70">
        {item.ip ?? "—"}
      </td>
    </tr>
  );
}
