import { createHash, randomInt } from "node:crypto";

/**
 * Shared shape for any single-use, expiring, numeric-code token stored as
 * `PasswordResetToken` (used for both "forgot password" and admin
 * invitations — same security properties: single-use via delete-on-consume,
 * time-boxed via `expiresAt`, never stored or logged in plaintext).
 */
export function generateVerificationCode(ttlMs: number) {
  const code = String(randomInt(100000, 1_000_000));
  return {
    code,
    tokenHash: hashVerificationCode(code),
    expiresAt: new Date(Date.now() + ttlMs),
  };
}

export function hashVerificationCode(code: string) {
  return createHash("sha256").update(code.trim()).digest("hex");
}
