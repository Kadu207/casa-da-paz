export function normalizarTelefone(telefone: string): string {
  return telefone.replace(/\D/g, '');
}

export function normalizarNome(nome: string): string {
  return nome
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function distanciaLevenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }
  return dp[m][n];
}

export function nomesSimilares(a: string, b: string, threshold = 0.85): boolean {
  const na = normalizarNome(a);
  const nb = normalizarNome(b);
  if (!na || !nb) return false;
  if (na === nb) return true;
  if (na.includes(nb) || nb.includes(na)) return true;
  const maxLen = Math.max(na.length, nb.length);
  const dist = distanciaLevenshtein(na, nb);
  return 1 - dist / maxLen >= threshold;
}

export function telefonesEquivalentes(a: string, b: string): boolean {
  const na = normalizarTelefone(a);
  const nb = normalizarTelefone(b);
  if (!na || !nb) return false;
  if (na === nb) return true;
  const suffix = (t: string) => (t.length >= 9 ? t.slice(-9) : t);
  return suffix(na) === suffix(nb);
}

export type MotivoDuplicata = 'telefone' | 'nome';

export function detectarDuplicata(
  candidato: { nomeCompleto: string; telefone: string | null },
  alvo: { nomeCompleto: string; telefone: string | null }
): MotivoDuplicata | null {
  if (candidato.telefone && alvo.telefone && telefonesEquivalentes(candidato.telefone, alvo.telefone)) {
    return 'telefone';
  }
  if (nomesSimilares(candidato.nomeCompleto, alvo.nomeCompleto)) {
    return 'nome';
  }
  return null;
}
