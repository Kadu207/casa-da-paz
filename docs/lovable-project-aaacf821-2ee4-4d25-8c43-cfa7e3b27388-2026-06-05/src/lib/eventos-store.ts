/**
 * Camada de eventos com persistência real no Supabase (Postgres + RLS).
 *
 * - Leitura pública: respeita RLS (anon/atendente só veem publicados; admin vê tudo).
 * - Escrita: somente admin (garantido por policy `eventos admin *`).
 * - Estado reativo via TanStack Query (chave `["eventos"]`).
 *
 * 100% portável: depende apenas do `@/integrations/supabase/client`, que
 * lê `VITE_SUPABASE_URL`/`VITE_SUPABASE_PUBLISHABLE_KEY`. Para hospedar em
 * Hetzner, basta apontar essas variáveis para a sua instância self-hosted
 * do Supabase (ou Postgres + PostgREST/GoTrue).
 */

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Row = Database["public"]["Tables"]["eventos"]["Row"];

export type Evento = {
  /** Slug estável usado nas URLs públicas (/eventos/:eventoId). */
  id: string;
  /** UUID interno no banco. */
  uuid: string;
  nomeEvento: string;
  /** ISO 8601 com timezone. */
  dataEvento: string;
  local: string;
  resumo: string;
  descricao: string[];
  recomendacoes?: string[];
  capacidadeMax?: number;
  inscricoes?: number;
  publicado: boolean;
  ordem: number;
};

export type EntradaEvento = {
  id?: string; // slug opcional; se vazio, gerado a partir do nome
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

const QK_ALL = ["eventos"] as const;
const QK_PUB = ["eventos", "publicados"] as const;
const qkOne = (slug: string) => ["eventos", "slug", slug] as const;

function fromRow(r: Row): Evento {
  return {
    id: r.slug,
    uuid: r.id,
    nomeEvento: r.nome_evento,
    dataEvento: r.data_evento,
    local: r.local,
    resumo: r.resumo ?? "",
    descricao: r.descricao ?? [],
    recomendacoes: r.recomendacoes ?? [],
    capacidadeMax: r.capacidade_max ?? undefined,
    inscricoes: r.inscricoes ?? undefined,
    publicado: r.publicado,
    ordem: r.ordem,
  };
}

function slugify(texto: string): string {
  return (
    texto
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || `evento-${Date.now().toString(36)}`
  );
}

// ---------- queries ----------

export async function buscarEventos(): Promise<Evento[]> {
  const { data, error } = await supabase
    .from("eventos")
    .select("*")
    .order("ordem", { ascending: true })
    .order("data_evento", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []).map(fromRow);
}

export async function buscarEventosPublicados(): Promise<Evento[]> {
  const { data, error } = await supabase
    .from("eventos")
    .select("*")
    .eq("publicado", true)
    .order("ordem", { ascending: true })
    .order("data_evento", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []).map(fromRow);
}

export async function buscarEventoPorSlug(
  slug: string,
): Promise<Evento | null> {
  const { data, error } = await supabase
    .from("eventos")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? fromRow(data) : null;
}

// ---------- mutations (admin) ----------

export async function criarEvento(dados: EntradaEvento): Promise<Evento> {
  if (!dados.nomeEvento?.trim()) throw new Error("Informe o nome do evento.");
  if (!dados.dataEvento) throw new Error("Informe data e horário.");
  if (!dados.local?.trim()) throw new Error("Informe o local.");

  const slugBase = dados.id?.trim() || slugify(dados.nomeEvento);
  // Próxima `ordem`
  const { data: maxRow } = await supabase
    .from("eventos")
    .select("ordem")
    .order("ordem", { ascending: false })
    .limit(1)
    .maybeSingle();
  const proximaOrdem = (maxRow?.ordem ?? -1) + 1;

  // Garante slug único: se houver conflito, sufixa
  let slug = slugBase;
  const { data: jaExiste } = await supabase
    .from("eventos")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();
  if (jaExiste) slug = `${slugBase}-${Date.now().toString(36)}`;

  const { data, error } = await supabase
    .from("eventos")
    .insert({
      slug,
      nome_evento: dados.nomeEvento.trim(),
      data_evento: dados.dataEvento,
      local: dados.local.trim(),
      resumo: dados.resumo?.trim() ?? "",
      descricao: dados.descricao ?? [],
      recomendacoes: dados.recomendacoes ?? [],
      capacidade_max: dados.capacidadeMax ?? null,
      inscricoes: dados.inscricoes ?? null,
      publicado: dados.publicado ?? false,
      ordem: proximaOrdem,
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return fromRow(data);
}

export async function atualizarEvento(
  slug: string,
  patch: Partial<EntradaEvento>,
): Promise<Evento> {
  const update: Database["public"]["Tables"]["eventos"]["Update"] = {};
  if (patch.nomeEvento !== undefined) update.nome_evento = patch.nomeEvento.trim();
  if (patch.dataEvento !== undefined) update.data_evento = patch.dataEvento;
  if (patch.local !== undefined) update.local = patch.local.trim();
  if (patch.resumo !== undefined) update.resumo = patch.resumo.trim();
  if (patch.descricao !== undefined) update.descricao = patch.descricao;
  if (patch.recomendacoes !== undefined) update.recomendacoes = patch.recomendacoes;
  if (patch.capacidadeMax !== undefined)
    update.capacidade_max = patch.capacidadeMax ?? null;
  if (patch.inscricoes !== undefined)
    update.inscricoes = patch.inscricoes ?? null;
  if (patch.publicado !== undefined) update.publicado = patch.publicado;

  const { data, error } = await supabase
    .from("eventos")
    .update(update)
    .eq("slug", slug)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return fromRow(data);
}

export async function removerEvento(slug: string): Promise<void> {
  const { error } = await supabase.from("eventos").delete().eq("slug", slug);
  if (error) throw new Error(error.message);
}

export async function definirPublicado(
  slug: string,
  publicado: boolean,
): Promise<Evento> {
  return atualizarEvento(slug, { publicado });
}

/** Troca a `ordem` deste evento com o vizinho na direção pedida. */
export async function moverEvento(
  slug: string,
  direcao: -1 | 1,
): Promise<void> {
  const lista = await buscarEventos();
  const idx = lista.findIndex((e) => e.id === slug);
  if (idx === -1) throw new Error("Evento não encontrado.");
  const alvo = idx + direcao;
  if (alvo < 0 || alvo >= lista.length) throw new Error("Já está no limite.");

  const a = lista[idx];
  const b = lista[alvo];

  // Troca em duas etapas para não bater na unicidade caso futuramente exista
  const { error: e1 } = await supabase
    .from("eventos")
    .update({ ordem: b.ordem })
    .eq("id", a.uuid);
  if (e1) throw new Error(e1.message);
  const { error: e2 } = await supabase
    .from("eventos")
    .update({ ordem: a.ordem })
    .eq("id", b.uuid);
  if (e2) throw new Error(e2.message);
}

// ---------- hooks ----------

export function useEventos() {
  return useQuery({ queryKey: QK_ALL, queryFn: buscarEventos });
}

export function useEventosPublicados() {
  return useQuery({ queryKey: QK_PUB, queryFn: buscarEventosPublicados });
}

export function useEvento(slug: string) {
  return useQuery({
    queryKey: qkOne(slug),
    queryFn: () => buscarEventoPorSlug(slug),
    enabled: Boolean(slug),
  });
}

/** Invalida todas as queries de eventos após uma mutação. */
export function useInvalidarEventos() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: ["eventos"] });
}

export function useCriarEvento() {
  const invalidar = useInvalidarEventos();
  return useMutation({ mutationFn: criarEvento, onSuccess: invalidar });
}

export function useAtualizarEvento() {
  const invalidar = useInvalidarEventos();
  return useMutation({
    mutationFn: ({ slug, patch }: { slug: string; patch: Partial<EntradaEvento> }) =>
      atualizarEvento(slug, patch),
    onSuccess: invalidar,
  });
}

export function useRemoverEvento() {
  const invalidar = useInvalidarEventos();
  return useMutation({ mutationFn: removerEvento, onSuccess: invalidar });
}

export function useDefinirPublicado() {
  const invalidar = useInvalidarEventos();
  return useMutation({
    mutationFn: ({ slug, publicado }: { slug: string; publicado: boolean }) =>
      definirPublicado(slug, publicado),
    onSuccess: invalidar,
  });
}

export function useMoverEvento() {
  const invalidar = useInvalidarEventos();
  return useMutation({
    mutationFn: ({ slug, direcao }: { slug: string; direcao: -1 | 1 }) =>
      moverEvento(slug, direcao),
    onSuccess: invalidar,
  });
}
