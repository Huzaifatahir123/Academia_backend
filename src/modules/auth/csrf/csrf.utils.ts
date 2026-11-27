
import {
  createHmac,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";

const csrfSecret = process.env.CSRF_SECRET;

if (!csrfSecret || csrfSecret.length < 32) {
  throw new Error(
    "CSRF_SECRET must be configured with at least 32 characters."
  );
}

// Generates a signed token bound to the current session.
export function generateCsrfToken(sessionId: string): string {
  const nonce = randomBytes(32).toString("base64url");

  const signature = createHmac("sha256", csrfSecret!)
    .update(`${sessionId}.${nonce}`)
    .digest("base64url");

  return `${nonce}.${signature}`;
}

// Verifies the token's signature and session binding.
export function verifyCsrfToken(
  token: string,
  sessionId: string
): boolean {
  const parts = token.split(".");

  if (parts.length !== 2) {
    return false;
  }

  const [nonce, signature] = parts;

  if (
    !/^[A-Za-z0-9_-]{43}$/.test(nonce) ||
    !/^[A-Za-z0-9_-]{43}$/.test(signature)
  ) {
    return false;
  }

  const expectedSignature = createHmac("sha256", csrfSecret!)
    .update(`${sessionId}.${nonce}`)
    .digest("base64url");

  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  return (
    actualBuffer.length === expectedBuffer.length &&
    timingSafeEqual(actualBuffer, expectedBuffer)
  );
}
