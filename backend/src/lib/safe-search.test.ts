import { describe, expect, it } from 'vitest';
import {
  prismaContainsInsensitive,
  sanitizeLikeContains,
} from './safe-search.js';

describe('sanitizeLikeContains', () => {
  it('remove metacaracteres LIKE', () => {
    expect(sanitizeLikeContains('%admin%')).toBe('admin');
    expect(sanitizeLikeContains('a_b')).toBe('ab');
    expect(sanitizeLikeContains('  casa   da  ')).toBe('casa da');
  });

  it('rejeita só wildcards', () => {
    expect(sanitizeLikeContains('%%%')).toBe('');
    expect(prismaContainsInsensitive('%')).toBeNull();
  });
});
