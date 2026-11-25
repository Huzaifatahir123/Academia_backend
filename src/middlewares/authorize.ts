
import type { RequestHandler } from "express";

type UserRole = "ADMIN" | "TEACHER" | "STUDENT";

export function authorize(...allowedRoles: UserRole[]): RequestHandler {
  return (req, res, next) => {
    // Authentication middleware must run first.
    if (!req.user) {
      res.status(401).json({
        error: {
          code: "UNAUTHENTICATED",
          message: "Authentication is required.",
        },
      });
      return;
    }

    if (!allowedRoles.includes(req.user.roleName as UserRole)) {
      res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "You do not have permission to perform this action.",
        },
      });
      return;
    }

    next();
  };
}
