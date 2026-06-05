import { describe, it, expect } from "vitest";
import axe from "axe-core";

/**
 * Auditoria automática de acessibilidade dos principais blocos HTML
 * do portal usando axe-core. Roda no jsdom: cobre semântica, ARIA,
 * labels, contraste estrutural e ordem de cabeçalhos.
 */

const runAxe = async (html: string) => {
  document.body.innerHTML = html;
  const results = await axe.run(document.body, {
    runOnly: {
      type: "tag",
      values: ["wcag2a", "wcag2aa"],
    },
  });
  return results.violations;
};

describe("Acessibilidade — auditoria axe-core", () => {
  it("formulário de agendar consulta sem violações críticas", async () => {
    const violations = await runAxe(`
      <main>
        <h1>Agendar consulta</h1>
        <form aria-describedby="hint">
          <label for="nome">Nome completo *</label>
          <input id="nome" name="nome" type="text" required aria-required="true" />
          <label for="telefone">Telefone *</label>
          <input id="telefone" name="telefone" type="tel" required aria-required="true" />
          <label for="data">Data preferida *</label>
          <input id="data" name="data" type="date" required aria-required="true" />
          <label for="obs">Observação</label>
          <textarea id="obs" name="obs"></textarea>
          <button type="submit">Enviar pedido</button>
          <p id="hint">Campos com * são obrigatórios.</p>
        </form>
      </main>
    `);
    expect(violations, JSON.stringify(violations, null, 2)).toEqual([]);
  });

  it("card de evento usa estrutura semântica", async () => {
    const violations = await runAxe(`
      <main>
        <h1>Eventos</h1>
        <ul>
          <li>
            <article>
              <h2>Gira de Caboclos</h2>
              <p>20 de junho de 2026, 19:30</p>
              <a href="/eventos/gira-caboclos">Ver detalhes</a>
            </article>
          </li>
        </ul>
      </main>
    `);
    expect(violations, JSON.stringify(violations, null, 2)).toEqual([]);
  });

  it("botões com ícone precisam de aria-label", async () => {
    const violations = await runAxe(`
      <main>
        <button aria-label="Fechar">
          <svg aria-hidden="true" width="16" height="16"><path d="M0 0L16 16"/></svg>
        </button>
      </main>
    `);
    const buttonNameViolations = violations.filter((v) => v.id === "button-name");
    expect(buttonNameViolations).toEqual([]);
  });
});
