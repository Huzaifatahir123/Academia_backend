

import type { Response } from "express";

const SESSION_COOKIE_NAME = "school_session";

const sameSiteValue = process.env.COOKIE_SAME_SITE ?? "lax";

if (!["lax", "strict", "none"].includes(sameSiteValue)) {
  throw new Error("Invalid COOKIE_SAME_SITE configuration");
}

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: sameSiteValue as "lax" | "strict" | "none",
  path: "/",
};

/**
 * Set the browser-session cookie.
 */
export function setSessionCookie(
  res: Response,
  sessionId: string
): void {
  res.cookie(SESSION_COOKIE_NAME, sessionId, cookieOptions);
}

/**
 * Clear the browser-session cookie.
 */
export function clearSessionCookie(res: Response): void {
  res.clearCookie(SESSION_COOKIE_NAME, cookieOptions);
}

/**
 * Cookie name used by authentication middleware.
 */
export { SESSION_COOKIE_NAME };
