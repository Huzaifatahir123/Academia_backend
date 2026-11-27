
import type { RequestHandler } from "express";

const frontendUrl = process.env.FRONTEND_URL;

if (!frontendUrl) {
  throw new Error("FRONTEND_URL is not configured.");
}

const allowedOrigin = new URL(frontendUrl).origin;

export const validateOrigin: RequestHandler = (req, res, next) => {
  const origin = req.get("Origin");

  // Reject requests without an Origin header.
  if (!origin) {
    res.status(403).json({
      error: {
        code: "ORIGIN_MISSING",
        message: "Request origin is required.",
      },
    });
    return;
  }

  // Reject requests from untrusted origins.
  if (origin !== allowedOrigin) {
    res.status(403).json({
      error: {
        code: "ORIGIN_NOT_ALLOWED",
        message: "Request origin is not allowed.",
      },
    });
    return;
  }

  next();
};
