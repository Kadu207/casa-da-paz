/**
 * Teste de integração: garante que os botões de ação do painel (editar,
 * excluir, publicar, mover) NÃO aparecem no DOM para usuários sem papel
 * de admin. Validamos pelo DOM real (RTL), não apenas inspeção de props,
 * para garantir que a renderização condicional realmente esconde os
 * controles — sem depender de CSS para "esconder" botões existentes.
 *
 * Por que isso importa: mesmo que o backend bloqueie (RLS + 403), expor
 * botões clicáveis a um atendente cria expectativa errada e pode permitir
 * que ele dispare requisições inúteis. A UI deve refletir a permissão.
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  createRouter,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  RouterProvider,
  Outlet,
} from "@tanstack/react-router";
import { EventoCard } from "@/routes/_authenticated.admin.eventos";
import type { Evento } from "@/lib/eventos-store";

const evento: Evento = {
  id: "evento-teste",
  slug: "evento-teste",
  nomeEvento: "Roda de Conversa",
  dataEvento: new Date("2026-08-10T19:00:00-03:00").toISOString(),
  local: "Casa da Paz",
  resumo: "Encontro mensal",
  descricao: ["Linha 1"],
  recomendacoes: ["Levar caderno"],
  capacidadeMax: 30,
  inscricoes: 0,
  publicado: true,
  ordem: 1,
};

function renderizar(isAdmin: boolean) {
  const noop = vi.fn();
  const root = createRootRoute({ component: () => <Outlet /> });
  const index = createRoute({
    getParentRoute: () => root,
    path: "/",
    component: () => (
      <ul>
        <EventoCard
          evento={evento}
          isAdmin={isAdmin}
          primeiro={false}
          ultimo={false}
          confirmando={false}
          onPedirConfirmacao={noop}
          onCancelarConfirmacao={noop}
          onRemover={noop}
          onTogglePublicado={noop}
          onMover={noop}
        />
      </ul>
    ),
  });
  const router = createRouter({
    routeTree: root.addChildren([index]),
    history: createMemoryHistory({ initialEntries: ["/"] }),
  });
  return render(<RouterProvider router={router} />);
}

describe("ações administrativas em /admin/eventos", () => {
  it("admin vê todos os controles (editar/excluir/publicar/mover)", async () => {
    renderizar(true);
    // os controles aparecem no DOM
    expect(
      await screen.findByTestId("admin-evento-acoes"),
    ).toBeInTheDocument();
    expect(screen.getByTestId("admin-acao-editar")).toBeInTheDocument();
    expect(screen.getByTestId("admin-acao-excluir")).toBeInTheDocument();
    expect(screen.getByTestId("admin-acao-publicar")).toBeInTheDocument();
    expect(screen.getByTestId("admin-acao-mover-cima")).toBeInTheDocument();
    expect(screen.getByTestId("admin-acao-mover-baixo")).toBeInTheDocument();
    // e o rótulo "Somente leitura" NÃO aparece
    expect(screen.queryByText(/somente leitura/i)).not.toBeInTheDocument();
  });

  it("atendente NÃO vê controles — só o rótulo 'Somente leitura'", async () => {
    renderizar(false);
    // aguarda o router montar
    expect(await screen.findByText(/somente leitura/i)).toBeInTheDocument();
    // os botões não existem no DOM (não estão apenas escondidos via CSS)
    expect(screen.queryByTestId("admin-evento-acoes")).toBeNull();
    expect(screen.queryByTestId("admin-acao-editar")).toBeNull();
    expect(screen.queryByTestId("admin-acao-excluir")).toBeNull();
    expect(screen.queryByTestId("admin-acao-publicar")).toBeNull();
    expect(screen.queryByTestId("admin-acao-mover-cima")).toBeNull();
    expect(screen.queryByTestId("admin-acao-mover-baixo")).toBeNull();
  });
});

