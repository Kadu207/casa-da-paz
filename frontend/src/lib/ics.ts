function escapeIcs(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}

function formatIcsDate(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    date.getUTCFullYear() +
    pad(date.getUTCMonth() + 1) +
    pad(date.getUTCDate()) +
    'T' +
    pad(date.getUTCHours()) +
    pad(date.getUTCMinutes()) +
    pad(date.getUTCSeconds()) +
    'Z'
  );
}

/** Gira padrão: 19h–22h no fuso local (America/Sao_Paulo ≈ UTC-3). */
export function eventoStartEnd(dataEvento: string): { start: Date; end: Date } {
  const [y, m, d] = dataEvento.slice(0, 10).split('-').map(Number);
  const start = new Date(Date.UTC(y, m - 1, d, 22, 0, 0));
  const end = new Date(Date.UTC(y, m - 1, d, 25, 0, 0));
  return { start, end };
}

export function generateIcsEvent(opts: {
  uid: string;
  title: string;
  start: Date;
  end: Date;
  location?: string;
  description?: string;
}): string {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Casa da Paz//Portal//PT',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${opts.uid}`,
    `DTSTAMP:${formatIcsDate(new Date())}`,
    `DTSTART:${formatIcsDate(opts.start)}`,
    `DTEND:${formatIcsDate(opts.end)}`,
    `SUMMARY:${escapeIcs(opts.title)}`,
  ];
  if (opts.location) lines.push(`LOCATION:${escapeIcs(opts.location)}`);
  if (opts.description) lines.push(`DESCRIPTION:${escapeIcs(opts.description)}`);
  lines.push('END:VEVENT', 'END:VCALENDAR');
  return lines.join('\r\n');
}

export function downloadIcs(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.ics') ? filename : `${filename}.ics`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
