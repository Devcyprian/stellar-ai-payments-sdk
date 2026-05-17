import { SessionKeyManager } from '../src/session';

describe('SessionKeyManager', () => {
  let mgr: SessionKeyManager;

  beforeEach(() => { mgr = new SessionKeyManager(); });

  it('creates a session key with defaults', () => {
    const key = mgr.create();
    expect(key.publicKey).toMatch(/^G/);
    expect(key.expiresAt).toBeGreaterThan(Date.now());
  });

  it('retrieves a valid session key by id', () => {
    const key = mgr.create({ label: 'test-agent' });
    expect(mgr.get(key.id)).not.toBeNull();
  });

  it('returns null for unknown id', () => {
    expect(mgr.get('nonexistent')).toBeNull();
  });

  it('revokes a session key', () => {
    const key = mgr.create();
    mgr.revoke(key.id);
    expect(mgr.get(key.id)).toBeNull();
  });

  it('validates destination allowlist', () => {
    const dest = 'GABC123ALLOWED';
    const key = mgr.create({ allowedDestinations: [dest] });
    expect(mgr.validate(key.id, dest, '1').valid).toBe(true);
    expect(mgr.validate(key.id, 'GOTHER', '1').valid).toBe(false);
  });

  it('validates max amount per tx', () => {
    const key = mgr.create({ maxAmountPerTx: '10' });
    expect(mgr.validate(key.id, 'GDEST', '5').valid).toBe(true);
    expect(mgr.validate(key.id, 'GDEST', '15').valid).toBe(false);
  });

  it('prunes expired keys', () => {
    const key = mgr.create({ ttlSeconds: -1 }); // already expired
    const pruned = mgr.pruneExpired();
    expect(pruned).toBeGreaterThanOrEqual(1);
    expect(mgr.get(key.id)).toBeNull();
  });

  it('lists only active keys', () => {
    mgr.create({ ttlSeconds: 3600 });
    mgr.create({ ttlSeconds: 3600 });
    expect(mgr.listActive().length).toBe(2);
  });
});

  it('count() returns number of active keys', () => {
    mgr.create();
    mgr.create();
    expect(mgr.count()).toBe(2);
  });
