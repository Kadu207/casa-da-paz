import { prisma } from './prisma.js';
import { sanitizeLikeContains } from './safe-search.js';

export type FtsTable = 'pessoas' | 'admin_audit_log';

/** Texto seguro para websearch/plainto_tsquery (sem operadores tsquery crus). */
export function ftsQueryText(raw: string): string | null {
  const cleaned = sanitizeLikeContains(raw)
    .replace(/[^\p{L}\p{N}\s-]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return cleaned || null;
}

export async function ftsSearchIds(table: FtsTable, raw: string, limit = 400): Promise<number[]> {
  const q = ftsQueryText(raw);
  if (!q) return [];
  const rows =
    table === 'pessoas'
      ? await prisma.$queryRaw<{ id: number }[]>`
          SELECT id
          FROM pessoas
          WHERE busca @@ websearch_to_tsquery('portuguese', ${q})
             OR busca @@ plainto_tsquery('portuguese', ${q})
          ORDER BY GREATEST(
            ts_rank(busca, websearch_to_tsquery('portuguese', ${q})),
            ts_rank(busca, plainto_tsquery('portuguese', ${q}))
          ) DESC
          LIMIT ${limit}
        `
      : await prisma.$queryRaw<{ id: number }[]>`
          SELECT id
          FROM admin_audit_log
          WHERE busca @@ websearch_to_tsquery('portuguese', ${q})
             OR busca @@ plainto_tsquery('portuguese', ${q})
          ORDER BY GREATEST(
            ts_rank(busca, websearch_to_tsquery('portuguese', ${q})),
            ts_rank(busca, plainto_tsquery('portuguese', ${q}))
          ) DESC
          LIMIT ${limit}
        `;
  return rows.map((r) => r.id);
}
