/**
 * Server functions para o painel de auditoria (/admin/auditoria).
 * - listarAuditoria: lista paginada com filtros (papel, rota, usuário/q),
 *   ordenação por data/papel/rota/usuário; inclui contagem total para paginação.
 * - exportarAuditoriaCsv: gera CSV de TODOS os registros que casam com os
 *   filtros (sem paginar) para suporte/diagnóstico.
 * - registrarAcaoAdmin: log explícito de ação administrativa bem-sucedida
 *   (export CSV, mudança em eventos/usuários etc.).
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getRequestIP, getRequestHeader } from "@tanstack/react-start/server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { forbidden } from "@/lib/auth.functions";

export type AuditoriaItem = {
  id: string;
  userId: string | null;
  email: string | null;
  nome: string | null;
  papel: string | null;
  rota: string;
  motivo: string;
  ip: string | null;
  userAgent: string | null;
  criadoEm: string;
};

export type ColunaOrdenacao = "data" | "papel" | "rota" | "usuario";

const filtroSchema = z.object({
  papel: z.string().trim().max(40).optional().nullable(),
  rota: z.string().trim().max(200).optional().nullable(),
  q: z.string().trim().max(120).optional().nullable(),
  ordem: z.enum(["desc", "asc"]).default("desc").optional(),
  ordenarPor: z.enum(["data", "papel", "rota", "usuario"]).default("data").optional(),
});

const paginacaoSchema = filtroSchema.extend({
  page: z.number().int().min(1).max(10_000).default(1),
  pageSize: z.number().int().min(1).max(200).default(25),
});

/** Garante que o chamador é admin sem disparar auditoria (essa é própria do log). */
async function requireAdminSilent(userId: string): Promise<void> {
  const { supabaseAdmin } = await import(
    "@/integrations/supabase/client.server"
  );
  const { data, error } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);
  if (error) throw new Error(error.message);
  const ehAdmin = (data ?? []).some((r) => r.role === "admin");
  if (!ehAdmin) forbidden("Acesso restrito a administradores.");
}

type LinhaRaw = {
  id: string;
  user_id: string | null;
  papel: string | null;
  rota: string;
  motivo: string;
  ip: string | null;
  user_agent: string | null;
  created_at: string;
};

function colunaDb(c: ColunaOrdenacao): string {
  switch (c) {
    case "papel": return "papel";
    case "rota": return "rota";
    // Ordenação por usuário usa user_id como chave estável.
    case "usuario": return "user_id";
    case "data":
    default: return "created_at";
  }
}

async function buscarRegistros(
  filtros: z.infer<typeof paginacaoSchema>,
  modo: "pagina" | "tudo",
): Promise<{ itens: AuditoriaItem[]; total: number }> {
  const { supabaseAdmin } = await import(
    "@/integrations/supabase/client.server"
  );

  // Resolve termo de busca → user_ids
  let userIdsAlvo: string[] | null = null;
  const q = filtros.q?.trim();
  if (q) {
    const ehUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(q);
    if (ehUuid) {
      userIdsAlvo = [q];
    } else {
      const { data: profs, error } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .or(`email.ilike.%${q}%,nome.ilike.%${q}%`)
        .limit(500);
      if (error) throw new Error(error.message);
      userIdsAlvo = (profs ?? []).map((p) => p.id);
      if (userIdsAlvo.length === 0) return { itens: [], total: 0 };
    }
  }

  let query = supabaseAdmin
    .from("admin_audit_log")
    .select("*", { count: "exact" });

  if (filtros.papel) query = query.eq("papel", filtros.papel);
  if (filtros.rota) query = query.ilike("rota", `%${filtros.rota}%`);
  if (userIdsAlvo) query = query.in("user_id", userIdsAlvo);

  const ascending = filtros.ordem === "asc";
  const ordenarPor = (filtros.ordenarPor ?? "data") as ColunaOrdenacao;
  const colunaPrincipal = colunaDb(ordenarPor);
  query = query.order(colunaPrincipal, { ascending });
  // Desempate determinístico por data → id
  if (colunaPrincipal !== "created_at") {
    query = query.order("created_at", { ascending: false });
  }
  query = query.order("id", { ascending: false });

  if (modo === "pagina") {
    const from = (filtros.page - 1) * filtros.pageSize;
    const to = from + filtros.pageSize - 1;
    query = query.range(from, to);
  } else {
    query = query.range(0, 9_999);
  }

  const { data, error, count } = await query;
  if (error) throw new Error(error.message);

  const linhas = (data ?? []) as LinhaRaw[];

  const idsUnicos = Array.from(
    new Set(linhas.map((l) => l.user_id).filter((x): x is string => !!x)),
  );
  const mapaPerfil = new Map<string, { nome: string; email: string }>();
  if (idsUnicos.length > 0) {
    const { data: profs } = await supabaseAdmin
      .from("profiles")
      .select("id, nome, email")
      .in("id", idsUnicos);
    for (const p of profs ?? []) {
      mapaPerfil.set(p.id, { nome: p.nome, email: p.email });
    }
  }

  let itens: AuditoriaItem[] = linhas.map((l) => ({
    id: l.id,
    userId: l.user_id,
    email: l.user_id ? (mapaPerfil.get(l.user_id)?.email ?? null) : null,
    nome: l.user_id ? (mapaPerfil.get(l.user_id)?.nome ?? null) : null,
    papel: l.papel,
    rota: l.rota,
    motivo: l.motivo,
    ip: l.ip,
    userAgent: l.user_agent,
    criadoEm: l.created_at,
  }));

  // Quando a ordenação é por "usuário", refinamos client-side pelo nome/email
  // já enriquecidos (o banco só conhece user_id).
  if (ordenarPor === "usuario") {
    itens = [...itens].sort((a, b) => {
      const va = (a.nome || a.email || a.userId || "").toLowerCase();
      const vb = (b.nome || b.email || b.userId || "").toLowerCase();
      if (va === vb) return 0;
      return ascending ? (va < vb ? -1 : 1) : (va > vb ? -1 : 1);
    });
  }

  return { itens, total: count ?? itens.length };
}

export const listarAuditoria = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => paginacaoSchema.parse(input))
  .handler(async ({ context, data }) => {
    await requireAdminSilent(context.userId);
    return buscarRegistros(data, "pagina");
  });

/** Retorna o CSV pronto (string) com até 10.000 linhas correspondentes ao filtro. */
export const exportarAuditoriaCsv = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => paginacaoSchema.parse(input))
  .handler(async ({ context, data }) => {
    await requireAdminSilent(context.userId);
    const { itens } = await buscarRegistros(data, "tudo");

    // Registra a exportação como ação administrativa bem-sucedida.
    await inserirLog({
      userId: context.userId,
      papel: "admin",
      rota: "exportarAuditoriaCsv",
      motivo: `export CSV (${itens.length} registros)`,
    });

    return { csv: paraCsv(itens), total: itens.length };
  });

function paraCsv(itens: AuditoriaItem[]): string {
  const cabecalho = [
    "criado_em", "user_id", "nome", "email", "papel",
    "rota", "motivo", "ip", "user_agent",
  ];
  const linhas = itens.map((i) =>
    [
      i.criadoEm, i.userId ?? "", i.nome ?? "", i.email ?? "", i.papel ?? "",
      i.rota, i.motivo, i.ip ?? "", i.userAgent ?? "",
    ].map(escaparCsv).join(","),
  );
  return "\uFEFF" + [cabecalho.join(","), ...linhas].join("\n");
}

function escaparCsv(valor: string): string {
  const precisaAspas = /[",\n\r]/.test(valor);
  const escapado = valor.replace(/"/g, '""');
  return precisaAspas ? `"${escapado}"` : escapado;
}

// ---------------------- Registro de ações administrativas ----------------------

async function inserirLog(opts: {
  userId: string | null;
  papel: string | null;
  rota: string;
  motivo: string;
}) {
  try {
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );
    let ip: string | null = null;
    let userAgent: string | null = null;
    try {
      ip = getRequestIP({ xForwardedFor: true }) ?? null;
      userAgent = getRequestHeader("user-agent") ?? null;
    } catch { /* sem contexto de request — ignora */ }
    await supabaseAdmin.from("admin_audit_log").insert({
      user_id: opts.userId,
      papel: opts.papel,
      rota: opts.rota,
      motivo: opts.motivo,
      ip,
      user_agent: userAgent,
    });
  } catch (e) {
    console.error("[auditoria] falha ao registrar:", e);
  }
}

/**
 * Registra uma ação administrativa bem-sucedida. Acessível para admins e
 * atendentes (cada papel registra com seu próprio nome). Usado pelo
 * frontend após mutações de eventos/usuários e por outros fluxos.
 */
export const registrarAcaoAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({
      rota: z.string().trim().min(1).max(120),
      motivo: z.string().trim().min(1).max(400),
    }).parse(input),
  )
  .handler(async ({ context, data }) => {
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );
    const { data: rolesData } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId);
    const papeis = (rolesData ?? []).map((r) => r.role as string);
    const papel = papeis.includes("admin")
      ? "admin"
      : papeis.includes("atendente") ? "atendente" : "nenhum";
    await inserirLog({
      userId: context.userId,
      papel,
      rota: data.rota,
      motivo: data.motivo,
    });
    return { ok: true };
  });
