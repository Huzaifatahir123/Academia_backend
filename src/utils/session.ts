
import { createHash, randomBytes } from "crypto";

/**
 * Generate a cryptographically secure session ID.
 */
export function generateSessionId(): string {
  return randomBytes(32).toString("base64url");
}

/**
 * Hash a session ID using SHA-256.
 *
 * Session IDs already have high entropy, so a fast
 * cryptographic hash is appropriate here.
 */
export function hashSessionId(sessionId: string): string {
  return createHash("sha256")
    .update(sessionId)
    .digest("hex");
}
