import { describe, expect, it } from 'vitest';
import { safeUrl } from './safe-url';

describe('safeUrl', () => {
  it('aceita http(s) e caminhos relativos', () => {
    expect(safeUrl('https://example.com/a')).toBe('https://example.com/a');
    expect(safeUrl('http://example.com')).toMatch(/^http:\/\//);
    expect(safeUrl('/portal/logo.png')).toBe('/portal/logo.png');
  });

  it('rejeita javascript e dados perigosos', () => {
    expect(safeUrl('javascript:alert(1)')).toBeNull();
    expect(safeUrl('data:text/html,<script>')).toBeNull();
    expect(safeUrl('//evil.com')).toBeNull();
    expect(safeUrl('')).toBeNull();
    expect(safeUrl(null)).toBeNull();
  });
});
