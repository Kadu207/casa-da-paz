import { describe, expect, it } from 'vitest';
import {
  SECAO_ANCORAS,
  enciclopedia,
  filtrarErvas,
  getErvaBySlug,
  splitReferencia,
} from './enciclopedia-ervas';

describe('enciclopédia de ervas', () => {
  it('publica 100 fotografias com crédito e arquivo', () => {
    expect(enciclopedia.ervas).toHaveLength(100);
    const slugs = new Set(enciclopedia.ervas.map((erva) => erva.slug));
    expect(slugs.size).toBe(100);
    for (const erva of enciclopedia.ervas) {
      expect(erva.credito?.tipo).toBe('fotografia');
      expect(erva.credito?.autor.length).toBeGreaterThan(1);
      expect(erva.credito?.licenca.length).toBeGreaterThan(2);
      expect(erva.credito?.fonte.startsWith('https://')).toBe(true);
      expect(erva.imagem.startsWith('/portal/ervas/fotos/')).toBe(true);
    }
    expect(SECAO_ANCORAS).toHaveLength(enciclopedia.secoes.length - 1);
  });

  it('encontra alecrim e filtra classificação quente', () => {
    expect(getErvaBySlug('alecrim')?.campos['Identificação botânica de referência']).toBe(
      'Salvia rosmarinus'
    );
    const quentes = filtrarErvas({ q: '', classificacao: 'quente', seguranca: '' });
    expect(quentes.length).toBeGreaterThan(0);
    expect(quentes.every((erva) => erva.classificacao === 'quente')).toBe(true);
  });

  it('busca sem acento e separa referência com link', () => {
    const achadas = filtrarErvas({ q: 'alfazema', classificacao: '', seguranca: '' });
    expect(achadas.some((erva) => erva.slug === 'alfazema-verdadeira')).toBe(true);
    const ref = splitReferencia(enciclopedia.referencias[0]);
    expect(ref.href.startsWith('https://')).toBe(true);
    expect(ref.rotulo.length).toBeGreaterThan(0);
  });
});
