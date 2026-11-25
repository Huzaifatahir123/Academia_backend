
import argon2 from "argon2";

/**
 * Hash a plain-text password using Argon2id.
 */
export async function hashPassword(
  password: string
): Promise<string> {
  return argon2.hash(password, {
    type: argon2.argon2id,
  });
}

/**
 * Verify a plain-text password against its stored hash.
 */
export async function verifyPassword(
  password: string,
  passwordHash: string
): Promise<boolean> {
  return argon2.verify(passwordHash, password);
}
