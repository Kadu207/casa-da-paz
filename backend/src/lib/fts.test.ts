import { describe, expect, it } from 'vitest';
import { ftsQueryText } from './fts.js';

describe('ftsQueryText', () => {
  it('remove wildcards LIKE e pontuação de tsquery', () => {
    expect(ftsQueryText('%João%')).toBe('João');
    expect(ftsQueryText('casa & paz')).toBe('casa paz');
  });

  it('rejeita vazio', () => {
    expect(ftsQueryText('%%%')).toBeNull();
    expect(ftsQueryText('   ')).toBeNull();
  });
});
