import { createHash, randomBytes } from 'node:crypto';

export const ACCESS_TOKEN_TTL = '15m';
export const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export const hashToken = (token: string) =>
  createHash('sha256').update(token).digest('hex');

/** High-entropy opaque token; only its sha256 is stored, so a slow hash is unnecessary. */
export function newRefreshToken() {
  const token = randomBytes(32).toString('base64url');
  return { token, hash: hashToken(token) };
}
