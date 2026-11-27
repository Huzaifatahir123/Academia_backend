
import type { RequestHandler } from "express";
import { timingSafeEqual } from "node:crypto";

import { SESSION_COOKIE_NAME } from "../sessions/session.cookie";
import { CSRF_COOKIE_NAME } from "./csrf.cookie";
import { verifyCsrfToken } from "./csrf.utils";

export const csrfProtection: RequestHandler = (req, res, next) => {
  const sessionId = req.cookies?.[SESSION_COOKIE_NAME];
  const csrfCookie = req.cookies?.[CSRF_COOKIE_NAME];
  const csrfHeader = req.get("X-CSRF-Token");

  if (
    typeof sessionId !== "string" ||
    typeof csrfCookie !== "string" ||
    typeof csrfHeader !== "string"
  ) {
    res.status(403).json({
      error: {
        code: "CSRF_TOKEN_MISSING",
        message: "CSRF token is missing.",
      },
    });
    return;
  }

  const cookieBuffer = Buffer.from(csrfCookie);
  const headerBuffer = Buffer.from(csrfHeader);

  const tokensMatch =
    cookieBuffer.length === headerBuffer.length &&
    timingSafeEqual(cookieBuffer, headerBuffer);

  if (!tokensMatch || !verifyCsrfToken(csrfCookie, sessionId)) {
    res.status(403).json({
      error: {
        code: "CSRF_TOKEN_INVALID",
        message: "CSRF token is invalid.",
      },
    });
    return;
  }

  next();
};
