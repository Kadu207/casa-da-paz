/**
 * Server functions de autenticação/gestão.
 *
 * Toda a lógica sensível (criar usuário, atribuir papel, remover, listar)
 * roda no servidor com a service role; as chamadas autenticadas validam o
 * papel "admin" do solicitante via has_role no banco (RLS continua sendo
 * a barreira final).
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type Papel = "admin" | "atendente";

export type UsuarioGerenciado = {
  id: string;
  email: string;
  nome: string;
  papel: Papel;
  criadoEm: string;
};

const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email("E-mail inválido")
  .max(255);

const senhaSchema = z
  .string()
  .min(8, "A senha precisa ter pelo menos 8 caracteres")
  .max(128);

const nomeSchema = z.string().trim().min(1, "Informe o nome").max(120);
const papelSchema = z.enum(["admin", "atendente"]);

/**
 * Bootstrap inicial: cria o primeiro admin se ainda não existir nenhum.
 * Público (não exige login). Idempotente: se já houver admin, recusa.
 * Retorna a senha provisória — o admin troca depois.
 */
export const bootstrapAdmin = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z.object({ email: emailSchema }).parse(input),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );

    // Já existe algum admin? Se sim, nega.
    const { data: rolesExist, error: rolesErr } = await supabaseAdmin
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin")
      .limit(1);
    if (rolesErr) throw new Error(rolesErr.message);
    if (rolesExist && rolesExist.length > 0) {
      throw new Error(
        "Bootstrap indisponível: já existe um administrador cadastrado.",
      );
    }

    // Gera senha provisória forte
    const senhaProvisoria = gerarSenhaProvisoria();

    // Cria o usuário com e-mail confirmado
    const { data: created, error: createErr } =
      await supabaseAdmin.auth.admin.createUser({
        email: data.email,
        password: senhaProvisoria,
        email_confirm: true,
        user_metadata: { nome: data.email.split("@")[0] },
      });
    if (createErr) throw new Error(createErr.message);
    if (!created.user) throw new Error("Falha ao criar usuário.");

    // O trigger handle_new_user já criou o profile.
    // Garante o papel admin (independente do e-mail).
    await supabaseAdmin
      .from("user_roles")
      .delete()
      .eq("user_id", created.user.id);
    const { error: roleErr } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: created.user.id, role: "admin" });
    if (roleErr) throw new Error(roleErr.message);

    return {
      email: data.email,
      senhaProvisoria,
    };
  });

/**
 * Erro 403 — usuário autenticado, mas sem permissão.
 * Lança uma `Response` para que o TanStack serialize o status corretamente.
 */
export function forbidden(msg = "Acesso negado."): never {
  throw new Response(msg, { status: 403 });
}

/**
 * Helpers puros — testáveis sem mockar o Supabase.
 * Recebem a lista de papéis do usuário e decidem o resultado.
 */
export function assertStaff(papeis: readonly Papel[]): Papel {
  if (papeis.includes("admin")) return "admin";
  if (papeis.includes("atendente")) return "atendente";
  forbidden("Acesso restrito à equipe do painel.");
}

export function assertAdmin(papeis: readonly Papel[]): void {
  if (!papeis.includes("admin"))
    forbidden("Acesso restrito a administradores.");
}

/** Lê os papéis do usuário direto do banco (com service role, ignora RLS). */
async function lerPapeis(userId: string): Promise<Papel[]> {
  const { supabaseAdmin } = await import(
    "@/integrations/supabase/client.server"
  );
  const { data, error } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);
  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => r.role as Papel);
}

/**
 * Registra um evento no log de auditoria (negação ou ação bem-sucedida).
 * Falhas no log NUNCA devem propagar — autorização é o que importa.
 */
async function registrarAuditoria(opts: {
  userId: string | null;
  papel: Papel | "nenhum" | null;
  rota: string;
  motivo: string;
  ip?: string | null;
  userAgent?: string | null;
}): Promise<void> {
  try {
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );
    let ip: string | null = opts.ip ?? null;
    let userAgent: string | null = opts.userAgent ?? null;
    if (!ip || !userAgent) {
      try {
        const { getRequestIP, getRequestHeader } = await import(
          "@tanstack/react-start/server"
        );
        ip = ip ?? (getRequestIP({ xForwardedFor: true }) ?? null);
        userAgent = userAgent ?? (getRequestHeader("user-agent") ?? null);
      } catch { /* sem request context */ }
    }
    await supabaseAdmin.from("admin_audit_log").insert({
      user_id: opts.userId,
      papel: opts.papel ?? null,
      rota: opts.rota,
      motivo: opts.motivo,
      ip,
      user_agent: userAgent,
    });
  } catch (e) {
    console.error("[auditoria] falha ao registrar:", e);
  }
}

/** Garante que o chamador é admin. Lança 403 + audita caso contrário. */
async function requireAdmin(userId: string, rota: string) {
  const papeis = await lerPapeis(userId);
  try {
    assertAdmin(papeis);
  } catch (e) {
    await registrarAuditoria({
      userId,
      papel: papeis[0] ?? "nenhum",
      rota,
      motivo: "papel admin requerido",
    });
    throw e;
  }
}

/** Garante que o chamador é admin OU atendente. Lança 403 + audita caso contrário. */
async function requireStaff(userId: string, rota: string): Promise<Papel> {
  const papeis = await lerPapeis(userId);
  try {
    return assertStaff(papeis);
  } catch (e) {
    await registrarAuditoria({
      userId,
      papel: papeis[0] ?? "nenhum",
      rota,
      motivo: "papel staff requerido",
    });
    throw e;
  }
}


/**
 * Retorna o papel e o nome do usuário logado (chamado pelo painel).
 * Lança 403 se o usuário não for admin nem atendente.
 */
export const meuPerfil = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const papel = await requireStaff(userId, "meuPerfil");
    const { data: profile } = await supabase
      .from("profiles")
      .select("nome, email")
      .eq("id", userId)
      .maybeSingle();
    return {
      id: userId,
      email: profile?.email ?? "",
      nome: profile?.nome ?? "",
      papel,
    };
  });

/**
 * Retorna o papel atual do usuário logado SEM lançar 403.
 * Usado pela página /acesso-negado para mensagem dinâmica.
 * Retorna { papel: 'admin' | 'atendente' | 'nenhum' }.
 */
export const meuPapel = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const papeis = await lerPapeis(context.userId);
    const papel: Papel | "nenhum" = papeis.includes("admin")
      ? "admin"
      : papeis.includes("atendente")
        ? "atendente"
        : "nenhum";
    return { papel };
  });


/** Lista todos os usuários (admin). */
export const listarUsuarios = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<UsuarioGerenciado[]> => {
    await requireAdmin(context.userId, "listarUsuarios");

    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );
    const { data: profiles, error } = await supabaseAdmin
      .from("profiles")
      .select("id, email, nome, created_at")
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    const { data: roles } = await supabaseAdmin
      .from("user_roles")
      .select("user_id, role");
    const mapaPapel = new Map<string, Papel>();
    for (const r of roles ?? []) {
      const atual = mapaPapel.get(r.user_id);
      if (atual === "admin") continue;
      mapaPapel.set(r.user_id, r.role as Papel);
    }
    return (profiles ?? []).map((p) => ({
      id: p.id,
      email: p.email,
      nome: p.nome,
      papel: mapaPapel.get(p.id) ?? "atendente",
      criadoEm: p.created_at,
    }));
  });

/** Cria um novo usuário (admin). Define senha provisória. */
export const criarUsuario = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        email: emailSchema,
        nome: nomeSchema,
        papel: papelSchema,
        senha: senhaSchema.optional(),
      })
      .parse(input),
  )
  .handler(async ({ context, data }) => {
    await requireAdmin(context.userId, "criarUsuario");

    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );
    const senha = data.senha ?? gerarSenhaProvisoria();
    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: senha,
      email_confirm: true,
      user_metadata: { nome: data.nome },
    });
    if (error) throw new Error(error.message);
    if (!created.user) throw new Error("Falha ao criar usuário.");

    // Atualiza o nome no profile (trigger pode ter usado fallback)
    await supabaseAdmin
      .from("profiles")
      .update({ nome: data.nome })
      .eq("id", created.user.id);

    // Define o papel solicitado (substitui o atribuído pelo trigger)
    await supabaseAdmin
      .from("user_roles")
      .delete()
      .eq("user_id", created.user.id);
    const { error: rErr } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: created.user.id, role: data.papel });
    if (rErr) throw new Error(rErr.message);

    await registrarAuditoria({
      userId: context.userId,
      papel: "admin",
      rota: "criarUsuario",
      motivo: `criou usuário ${data.email} (papel=${data.papel})`,
    });

    return {
      id: created.user.id,
      email: data.email,
      nome: data.nome,
      papel: data.papel,
      senhaProvisoria: data.senha ? null : senha,
    };
  });

/** Atualiza nome/papel/senha (admin). */
export const atualizarUsuario = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        id: z.string().uuid(),
        nome: nomeSchema.optional(),
        papel: papelSchema.optional(),
        novaSenha: senhaSchema.optional(),
      })
      .parse(input),
  )
  .handler(async ({ context, data }) => {
    await requireAdmin(context.userId, "atualizarUsuario");

    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );

    if (data.nome !== undefined) {
      const { error } = await supabaseAdmin
        .from("profiles")
        .update({ nome: data.nome })
        .eq("id", data.id);
      if (error) throw new Error(error.message);
    }

    if (data.novaSenha) {
      const { error } = await supabaseAdmin.auth.admin.updateUserById(data.id, {
        password: data.novaSenha,
      });
      if (error) throw new Error(error.message);
    }

    if (data.papel) {
      await supabaseAdmin.from("user_roles").delete().eq("user_id", data.id);
      const { error } = await supabaseAdmin
        .from("user_roles")
        .insert({ user_id: data.id, role: data.papel });
      if (error) throw new Error(error.message);
    }

    const mudancas = [
      data.nome !== undefined ? "nome" : null,
      data.papel ? `papel=${data.papel}` : null,
      data.novaSenha ? "senha" : null,
    ].filter(Boolean).join(", ") || "nenhuma";
    await registrarAuditoria({
      userId: context.userId,
      papel: "admin",
      rota: "atualizarUsuario",
      motivo: `atualizou usuário ${data.id} (${mudancas})`,
    });

    return { ok: true };
  });

/** Remove um usuário (admin). Não permite remover a si mesmo. */
export const removerUsuario = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ context, data }) => {
    await requireAdmin(context.userId, "removerUsuario");
    if (context.userId === data.id) {
      throw new Error("Você não pode remover sua própria conta.");
    }
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );
    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.id);
    if (error) throw new Error(error.message);
    await registrarAuditoria({
      userId: context.userId,
      papel: "admin",
      rota: "removerUsuario",
      motivo: `removeu usuário ${data.id}`,
    });
    return { ok: true };
  });

function gerarSenhaProvisoria(): string {
  const chars =
    "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%";
  let out = "";
  const arr = new Uint32Array(16);
  crypto.getRandomValues(arr);
  for (const n of arr) out += chars[n % chars.length];
  return out;
}
