/**
 * Prisma `contains` vira `ILIKE '%valor%'` parametrizado (sem SQL injection).
 * Ainda assim `%` e `_` no input do usuário alargam o padrão LIKE.
 * Removemos esses metacaracteres para busca por substring literal.
 */
export function sanitizeLikeContains(input: string): string {
  return input.replace(/[%_\\]/g, '').replace(/\s+/g, ' ').trim();
}

export function prismaContainsInsensitive(raw: string): { contains: string; mode: 'insensitive' } | null {
  const needle = sanitizeLikeContains(raw);
  if (!needle) return null;
  return { contains: needle, mode: 'insensitive' };
}

export function prismaContainsExact(raw: string): { contains: string } | null {
  const needle = sanitizeLikeContains(raw);
  if (!needle) return null;
  return { contains: needle };
}
