
import type { Response } from "express";

export const CSRF_COOKIE_NAME = "csrf_token";

const sameSiteValue = process.env.COOKIE_SAME_SITE ?? "lax";

if (!["lax", "strict", "none"].includes(sameSiteValue)) {
  throw new Error("Invalid COOKIE_SAME_SITE configuration");
}

const cookieOptions = {
  httpOnly: false,
  secure: process.env.NODE_ENV === "production",
  sameSite: sameSiteValue as "lax" | "strict" | "none",
  path: "/",
};

export function setCsrfCookie(
  res: Response,
  token: string
): void {
  res.cookie(CSRF_COOKIE_NAME, token, cookieOptions);
}

export function clearCsrfCookie(res: Response): void {
  res.clearCookie(CSRF_COOKIE_NAME, cookieOptions);
}
