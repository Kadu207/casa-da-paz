/**
 * Gera um arquivo .ics (iCalendar) para download.
 * Compatível com Google Calendar, Apple Calendar, Outlook.
 *
 * Os horários são tratados como hora local de America/Sao_Paulo via TZID,
 * para que o calendário do usuário exiba o mesmo horário publicado pela Casa,
 * independentemente do fuso do dispositivo.
 */

const TZID = "America/Sao_Paulo";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

/** Formata data UTC no formato iCal (YYYYMMDDTHHMMSSZ) — usado para DTSTAMP. */
function toUtcIcsStamp(date: Date): string {
  return (
    date.getUTCFullYear() +
    pad(date.getUTCMonth() + 1) +
    pad(date.getUTCDate()) +
    "T" +
    pad(date.getUTCHours()) +
    pad(date.getUTCMinutes()) +
    pad(date.getUTCSeconds()) +
    "Z"
  );
}

/**
 * Converte um ISO local ("2026-06-20T19:30:00", sem Z) no formato
 * iCal local "YYYYMMDDTHHMMSS", preservando os números (sem conversão de fuso).
 */
function toLocalIcsDate(iso: string): string {
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?/);
  if (!m) {
    // Fallback: trata como UTC e formata
    const d = new Date(iso);
    return (
      d.getUTCFullYear() +
      pad(d.getUTCMonth() + 1) +
      pad(d.getUTCDate()) +
      "T" +
      pad(d.getUTCHours()) +
      pad(d.getUTCMinutes()) +
      pad(d.getUTCSeconds())
    );
  }
  const [, y, mo, d, h, mi, s = "00"] = m;
  return `${y}${mo}${d}T${h}${mi}${s}`;
}

/** Soma minutos a um ISO local e devolve no formato iCal local. */
function addMinutesLocal(iso: string, minutes: number): string {
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?/);
  if (!m) return toLocalIcsDate(iso);
  const [, y, mo, d, h, mi, s = "00"] = m;
  // Aritmética em UTC para evitar deslocamentos do fuso local do servidor.
  const t = Date.UTC(+y, +mo - 1, +d, +h, +mi, +s) + minutes * 60_000;
  const dt = new Date(t);
  return (
    dt.getUTCFullYear() +
    pad(dt.getUTCMonth() + 1) +
    pad(dt.getUTCDate()) +
    "T" +
    pad(dt.getUTCHours()) +
    pad(dt.getUTCMinutes()) +
    pad(dt.getUTCSeconds())
  );
}

function escapeIcs(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

export type IcsEvent = {
  uid: string;
  title: string;
  description: string;
  location: string;
  /** ISO local em São Paulo (ex.: "2026-06-20T19:30:00"). Z é ignorado. */
  start: string;
  durationMinutes?: number;
  url?: string;
};

/**
 * Bloco VTIMEZONE para America/Sao_Paulo. São Paulo deixou de observar DST
 * em 2019, então o offset é fixo em -03:00.
 */
const VTIMEZONE_BLOCK = [
  "BEGIN:VTIMEZONE",
  `TZID:${TZID}`,
  "X-LIC-LOCATION:America/Sao_Paulo",
  "BEGIN:STANDARD",
  "DTSTART:19700101T000000",
  "TZNAME:-03",
  "TZOFFSETFROM:-0300",
  "TZOFFSETTO:-0300",
  "END:STANDARD",
  "END:VTIMEZONE",
];

function veventLines(ev: IcsEvent, stamp: string): string[] {
  const startLocal = toLocalIcsDate(ev.start);
  const endLocal = addMinutesLocal(ev.start, ev.durationMinutes ?? 90);
  return [
    "BEGIN:VEVENT",
    `UID:${ev.uid}@casadapaz`,
    `DTSTAMP:${stamp}`,
    `DTSTART;TZID=${TZID}:${startLocal}`,
    `DTEND;TZID=${TZID}:${endLocal}`,
    `SUMMARY:${escapeIcs(ev.title)}`,
    `DESCRIPTION:${escapeIcs(ev.description)}`,
    `LOCATION:${escapeIcs(ev.location)}`,
    ev.url ? `URL:${ev.url}` : "",
    "END:VEVENT",
  ].filter(Boolean);
}

function calendarHeader(): string[] {
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Casa da Paz//Portal//PT-BR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    ...VTIMEZONE_BLOCK,
  ];
}

export function buildIcs(ev: IcsEvent): string {
  const stamp = toUtcIcsStamp(new Date());
  return [...calendarHeader(), ...veventLines(ev, stamp), "END:VCALENDAR"].join(
    "\r\n",
  );
}

export function buildIcsCalendar(events: IcsEvent[]): string {
  const stamp = toUtcIcsStamp(new Date());
  return [
    ...calendarHeader(),
    ...events.flatMap((ev) => veventLines(ev, stamp)),
    "END:VCALENDAR",
  ].join("\r\n");
}

function triggerDownload(content: string, filename: string) {
  if (typeof window === "undefined") return;
  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function downloadIcs(ev: IcsEvent, filename?: string): void {
  triggerDownload(buildIcs(ev), filename ?? `${ev.uid}.ics`);
}

export function downloadIcsCalendar(
  events: IcsEvent[],
  filename = "eventos-casa-da-paz.ics",
): void {
  triggerDownload(buildIcsCalendar(events), filename);
}
