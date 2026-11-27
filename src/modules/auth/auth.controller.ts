
import type { RequestHandler } from "express";
import { prisma } from "../../db/prisma";
import { verifyPassword,hashPassword } from "../../utils/password";
import { createSession,revokeSession } from "./sessions/session.service";
import { setSessionCookie , SESSION_COOKIE_NAME,clearSessionCookie} from "./sessions/session.cookie";
import { loginSchema,changePasswordSchema } from "./auth.schema";
import { generateCsrfToken } from "./csrf/csrf.utils";
import { setCsrfCookie } from "./csrf/csrf.cookie";
import type { AuthenticatedUser } from "./auth.types";
import { clearCsrfCookie } from "./csrf/csrf.cookie";
export const login: RequestHandler = async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid login details.",
        details: parsed.error.flatten().fieldErrors,
      },
    });
    return;
  }

  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      passwordHash: true,
      emailVerifiedAt: true,
      status: true,

    },
  });

  // Use the same response for an unknown email and incorrect password.
  if (!user || !user.passwordHash) {
    res.status(401).json({
      error: {
        code: "INVALID_CREDENTIALS",
        message: "Invalid email or password.",
      },
    });
    return;
  }

  const passwordIsValid = await verifyPassword(
    password,
    user.passwordHash
  );

  if (!passwordIsValid) {
    res.status(401).json({
      error: {
        code: "INVALID_CREDENTIALS",
        message: "Invalid email or password.",
      },
    });
    return;
  }

  if (user.status !== "ACTIVE" || !user.emailVerifiedAt) {
    res.status(403).json({
      error: {
        code: "ACCOUNT_NOT_ACTIVE",
        message: "Your account is not active or your email is not verified.",
      },
    });
    return;
  }

  const session = await createSession(user.id);

  setSessionCookie(res, session.sessionId);

  res.status(200).json({
    message: "Login successful.",
    user: {
      id: user.id.toString(),
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
    },
  });
};
export const getMe: RequestHandler = (req, res) => {
  if (!req.user) {
    res.status(401).json({
      error: {
        code: "UNAUTHENTICATED",
        message: "Authentication is required.",
      },
    });
    return;
  }

  res.status(200).json({
    user: {
      id: req.user.id.toString(),
      roleId: req.user.roleId.toString(),
      roleName: req.user.roleName,
      firstName: req.user.firstName,
      lastName: req.user.lastName,
      email: req.user.email,
    },
  });
};
export const logout: RequestHandler = async (req, res) => {
  const sessionId = req.cookies?.[SESSION_COOKIE_NAME];

  if (typeof sessionId === "string" && sessionId) {
    await revokeSession(sessionId);
  }

  clearSessionCookie(res);

  res.status(200).json({
    message: "Logout successful.",
  });
};
export const getCsrfToken: RequestHandler = (req, res) => {
  const sessionId = req.cookies?.[SESSION_COOKIE_NAME];

  if (typeof sessionId !== "string" || !sessionId) {
    res.status(401).json({
      error: {
        code: "UNAUTHENTICATED",
        message: "Authentication is required.",
      },
    });
    return;
  }

  const csrfToken = generateCsrfToken(sessionId);

  setCsrfCookie(res, csrfToken);

  res.status(200).json({
    csrfToken,
  });
};

export const changePassword: RequestHandler = async (req, res) => {
  if (!req.user) {
    res.status(401).json({
      error: {
        code: "UNAUTHENTICATED",
        message: "Authentication is required.",
      },
    });
    return;
  }

  const parsed = changePasswordSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid password details.",
        details: parsed.error.flatten().fieldErrors,
      },
    });
    return;
  }

  const { currentPassword, newPassword } = parsed.data;

  if (currentPassword === newPassword) {
    res.status(400).json({
      error: {
        code: "SAME_PASSWORD",
        message: "New password must be different from the current password.",
      },
    });
    return;
  }

  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: {
      passwordHash: true,
    },
  });

  if (!user?.passwordHash) {
    res.status(400).json({
      error: {
        code: "PASSWORD_NOT_SET",
        message: "A current password is not configured for this account.",
      },
    });
    return;
  }

  const passwordIsValid = await verifyPassword(
    currentPassword,
    user.passwordHash
  );

  if (!passwordIsValid) {
    res.status(400).json({
      error: {
        code: "CURRENT_PASSWORD_INCORRECT",
        message: "Current password is incorrect.",
      },
    });
    return;
  }

  const newPasswordHash = await hashPassword(newPassword);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: req.user.id },
      data: {
        passwordHash: newPasswordHash,
      },
    }),

    prisma.session.updateMany({
      where: {
        userId: req.user.id,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    }),
  ]);

  clearSessionCookie(res);
  clearCsrfCookie(res);

  res.status(200).json({
    message: "Password changed successfully. Please log in again.",
  });
};

