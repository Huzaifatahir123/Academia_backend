
import type { RequestHandler } from "express";

import { validateSession } from "../modules/auth/sessions/session.service";
import {
  clearSessionCookie,
  SESSION_COOKIE_NAME,
} from "../modules/auth/sessions/session.cookie";

export const authenticate: RequestHandler = async (
  req,
  res,
  next
) => {
  const sessionId: unknown =
    req.cookies?.[SESSION_COOKIE_NAME];

  // No session cookie
  if (typeof sessionId !== "string" || !sessionId) {
    res.status(401).json({
      error: {
        code: "UNAUTHENTICATED",
        message: "Authentication is required.",
      },
    });
    return;
  }

  // Validate the session against PostgreSQL
  const user = await validateSession(sessionId);

  // Invalid, expired, revoked, or inactive session
  if (!user) {
    clearSessionCookie(res);

    res.status(401).json({
      error: {
        code: "INVALID_SESSION",
        message: "Your session is invalid or expired. Please log in again.",
      },
    });
    return;
  }

  // Attach authenticated user to Express request
  req.user = user;

  next();
};
