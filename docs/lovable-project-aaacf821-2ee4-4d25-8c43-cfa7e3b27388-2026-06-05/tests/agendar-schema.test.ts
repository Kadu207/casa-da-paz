import { describe, it, expect } from "vitest";
import { agendarSchema } from "@/lib/agendar-schema";

const tomorrow = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split("T")[0];
};

const yesterday = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split("T")[0];
};

const valid = {
  nome: "Maria Silva",
  telefone: "(31) 99999-0000",
  dataPreferida: tomorrow(),
  observacao: "",
  website: "",
  turnstileToken: "x".repeat(20),
};

describe("agendarSchema", () => {
  it("aceita payload válido", () => {
    const r = agendarSchema.safeParse(valid);
    expect(r.success).toBe(true);
  });

  it("rejeita nome curto", () => {
    const r = agendarSchema.safeParse({ ...valid, nome: "M" });
    expect(r.success).toBe(false);
  });

  it("rejeita nome com números", () => {
    const r = agendarSchema.safeParse({ ...valid, nome: "Maria123" });
    expect(r.success).toBe(false);
  });

  it("rejeita telefone curto", () => {
    const r = agendarSchema.safeParse({ ...valid, telefone: "12345" });
    expect(r.success).toBe(false);
  });

  it("rejeita telefone com letras", () => {
    const r = agendarSchema.safeParse({ ...valid, telefone: "31abcdefghij" });
    expect(r.success).toBe(false);
  });

  it("rejeita data no passado", () => {
    const r = agendarSchema.safeParse({ ...valid, dataPreferida: yesterday() });
    expect(r.success).toBe(false);
  });

  it("rejeita data vazia", () => {
    const r = agendarSchema.safeParse({ ...valid, dataPreferida: "" });
    expect(r.success).toBe(false);
  });

  it("aceita observação até 500 chars", () => {
    const r = agendarSchema.safeParse({
      ...valid,
      observacao: "a".repeat(500),
    });
    expect(r.success).toBe(true);
  });

  it("rejeita observação acima de 500 chars", () => {
    const r = agendarSchema.safeParse({
      ...valid,
      observacao: "a".repeat(501),
    });
    expect(r.success).toBe(false);
  });

  it("rejeita honeypot preenchido (anti-spam)", () => {
    const r = agendarSchema.safeParse({
      ...valid,
      website: "http://spam.com",
    });
    expect(r.success).toBe(false);
  });

  it("aceita honeypot vazio", () => {
    const r = agendarSchema.safeParse({ ...valid, website: "" });
    expect(r.success).toBe(true);
  });
});
