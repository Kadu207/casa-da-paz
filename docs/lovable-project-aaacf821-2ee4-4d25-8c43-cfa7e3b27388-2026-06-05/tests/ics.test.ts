import { describe, it, expect } from "vitest";
import { buildIcs, buildIcsCalendar } from "@/lib/ics";

describe("buildIcs", () => {
  const ev = {
    uid: "gira-caboclos",
    title: "Gira de Caboclos",
    description: "Trabalho espiritual",
    location: "Casa da Paz",
    // ISO local (horário de São Paulo)
    start: "2026-06-20T19:30:00",
    durationMinutes: 120,
  };

  it("contém envelope VCALENDAR/VEVENT", () => {
    const ics = buildIcs(ev);
    expect(ics).toContain("BEGIN:VCALENDAR");
    expect(ics).toContain("END:VCALENDAR");
    expect(ics).toContain("BEGIN:VEVENT");
    expect(ics).toContain("END:VEVENT");
  });

  it("inclui SUMMARY e LOCATION", () => {
    const ics = buildIcs(ev);
    expect(ics).toContain("SUMMARY:Gira de Caboclos");
    expect(ics).toContain("LOCATION:Casa da Paz");
  });

  it("usa UID único", () => {
    const ics = buildIcs(ev);
    expect(ics).toContain("UID:gira-caboclos@casadapaz");
  });

  it("escapa vírgulas e quebras de linha", () => {
    const ics = buildIcs({
      ...ev,
      description: "Linha 1\nLinha 2, com vírgula",
    });
    expect(ics).toContain("Linha 1\\nLinha 2\\, com vírgula");
  });

  it("usa TZID America/Sao_Paulo e mantém horário local sem conversão", () => {
    const ics = buildIcs(ev);
    expect(ics).toContain("BEGIN:VTIMEZONE");
    expect(ics).toContain("TZID:America/Sao_Paulo");
    // 19:30 local + 120min = 21:30 local
    expect(ics).toMatch(/DTSTART;TZID=America\/Sao_Paulo:20260620T193000/);
    expect(ics).toMatch(/DTEND;TZID=America\/Sao_Paulo:20260620T213000/);
  });
});

describe("buildIcsCalendar", () => {
  it("agrupa múltiplos eventos no mesmo VCALENDAR", () => {
    const ics = buildIcsCalendar([
      {
        uid: "a",
        title: "A",
        description: "",
        location: "",
        start: "2026-06-20T19:30:00",
        durationMinutes: 60,
      },
      {
        uid: "b",
        title: "B",
        description: "",
        location: "",
        start: "2026-07-10T15:00:00",
        durationMinutes: 60,
      },
    ]);
    expect(ics.match(/BEGIN:VEVENT/g)?.length).toBe(2);
    expect(ics).toContain("TZID:America/Sao_Paulo");
    expect(ics).toContain("UID:a@casadapaz");
    expect(ics).toContain("UID:b@casadapaz");
  });
});
