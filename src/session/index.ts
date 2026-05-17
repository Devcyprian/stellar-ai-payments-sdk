/**
 * Session Key Management
 * Short-lived signing keys for AI agents with scoped permissions and TTL.
 */
import { Keypair } from '@stellar/stellar-sdk';
import * as crypto from 'crypto';

export interface SessionKeyOptions {
  ttlSeconds?: number;
  maxAmountPerTx?: string;   // in XLM
  allowedDestinations?: string[];
  label?: string;
}

export interface SessionKey {
  id: string;
  publicKey: string;
  secretKey: string;
  createdAt: number;
  expiresAt: number;
  options: SessionKeyOptions;
}

export interface SessionKeyStore {
  [id: string]: SessionKey;
}

export class SessionKeyManager {
  private store: SessionKeyStore = {};

  /** Create a new session key with optional constraints. */
  create(options: SessionKeyOptions = {}): SessionKey {
    const kp = Keypair.random();
    const now = Date.now();
    const ttl = (options.ttlSeconds ?? 3600) * 1000;
    const session: SessionKey = {
      id: crypto.randomUUID(),
      publicKey: kp.publicKey(),
      secretKey: kp.secret(),
      createdAt: now,
      expiresAt: now + ttl,
      options,
    };
    this.store[session.id] = session;
    return session;
  }

  /** Retrieve a session key by ID. Returns null if expired or not found. */
  get(id: string): SessionKey | null {
    const session = this.store[id];
    if (!session) return null;
    if (Date.now() > session.expiresAt) {
      this.revoke(id);
      return null;
    }
    return session;
  }

  /** Revoke a session key immediately. */
  revoke(id: string): void {
    delete this.store[id];
  }

  /** Revoke all expired session keys. */
  pruneExpired(): number {
    const now = Date.now();
    let count = 0;
    for (const id of Object.keys(this.store)) {
      if (now > this.store[id].expiresAt) {
        delete this.store[id];
        count++;
      }
    }
    return count;
  }

  /** Validate that a session key is allowed to sign a given payment. */
  validate(
    id: string,
    destination: string,
    amount: string
  ): { valid: boolean; reason?: string } {
    const session = this.get(id);
    if (!session) return { valid: false, reason: 'Session key not found or expired' };

    const { allowedDestinations, maxAmountPerTx } = session.options;

    if (allowedDestinations && !allowedDestinations.includes(destination)) {
      return { valid: false, reason: `Destination ${destination} not in allowlist` };
    }

    if (maxAmountPerTx && parseFloat(amount) > parseFloat(maxAmountPerTx)) {
      return { valid: false, reason: `Amount ${amount} exceeds max ${maxAmountPerTx}` };
    }

    return { valid: true };
  }

  /** List all active (non-expired) session keys. */
  listActive(): SessionKey[] {
    const now = Date.now();
    return Object.values(this.store).filter((s) => now <= s.expiresAt);
  }
}

  /** Count total active session keys. */
  count(): number {
    return this.listActive().length;
  }

  /** Serialize active sessions to JSON (excludes secret keys). */
  toJSON(): Array<Omit<SessionKey, 'secretKey'>> {
    return this.listActive().map(({ secretKey: _sk, ...rest }) => rest);
  }

  /** Extend a session key's TTL by additional seconds. */
  extend(id: string, additionalSeconds: number): boolean {
    const session = this.store[id];
    if (!session) return false;
    session.expiresAt += additionalSeconds * 1000;
    return true;
  }

  /** Find session keys by label. */
  findByLabel(label: string): SessionKey[] {
    return this.listActive().filter((s) => s.options.label === label);
  }
