import { describe, expect, it } from 'vitest';

type PolicyGrant = 'read' | 'write' | 'own' | 'none';

function grantAllows(grant: PolicyGrant | undefined, action: 'read' | 'write'): boolean {
  if (!grant || grant === 'none') return false;
  if (grant === 'own') return action === 'read';
  if (action === 'read') return grant === 'read' || grant === 'write';
  return grant === 'write';
}

describe('RBAC grantAllows (FE mirror)', () => {
  it('write implica read', () => {
    expect(grantAllows('write', 'read')).toBe(true);
    expect(grantAllows('write', 'write')).toBe(true);
  });
  it('own só read', () => {
    expect(grantAllows('own', 'read')).toBe(true);
    expect(grantAllows('own', 'write')).toBe(false);
  });
  it('none e undefined negam', () => {
    expect(grantAllows('none', 'read')).toBe(false);
    expect(grantAllows(undefined, 'write')).toBe(false);
  });
});
