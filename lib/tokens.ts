import { createHash, randomBytes, randomUUID } from 'node:crypto';

/** A URL-safe random token with 256 bits of entropy. */
export function generateToken(): string {
  return randomBytes(32).toString('base64url');
}

/** Tokens are stored as SHA-256 hashes so a database leak does not expose working links. */
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function newId(prefix: string): string {
  return `${prefix}_${randomUUID().replace(/-/g, '').slice(0, 16)}`;
}
