
import { prisma } from "../../../db/prisma.ts";
import {
  generateSessionId,
  hashSessionId,
} from "./session.utils.ts";

const IDLE_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
const ABSOLUTE_TIMEOUT_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

/**
 * Create a new database-backed session.
 */
export async function createSession(userId: bigint) {
  const sessionId = generateSessionId();
  const tokenHash = hashSessionId(sessionId);

  const now = new Date();
  const expiresAt = new Date(
    now.getTime() + ABSOLUTE_TIMEOUT_MS
  );

  await prisma.session.create({
    data: {
      userId,
      tokenHash,
      expiresAt,
      lastUsedAt: now,
    },
  });

  return {
    sessionId,
    expiresAt,
  };
}

/**
 * Validate a session and retrieve its user.
 */
export async function validateSession(sessionId: string) {
  const tokenHash = hashSessionId(sessionId);

  const session = await prisma.session.findUnique({
    where: { tokenHash },
    include: {
    user: {
    include: {
      role: {
        select: {
          name: true,
        },
      },
    },
  },
},
  });

  if (!session) {
    return null;
  }

  const now = new Date();

  // Check revocation and absolute expiration.
  if (
    session.revokedAt ||
    session.expiresAt <= now
  ) {
    return null;
  }

  // Check inactivity timeout.
  const lastActivity =
    session.lastUsedAt ?? session.createdAt;

  if (
    now.getTime() - lastActivity.getTime() >
    IDLE_TIMEOUT_MS
  ) {
    return null;
  }

  // Ensure the account is eligible to authenticate.
  if (
    session.user.status !== "ACTIVE" ||
    !session.user.emailVerifiedAt
  ) {
    return null;
  }

  // Update the last activity timestamp.
  await prisma.session.update({
    where: { id: session.id },
    data: { lastUsedAt: now },
  });

  return {
    id: session.user.id,
    roleId: session.user.roleId,
    firstName: session.user.firstName,
    lastName: session.user.lastName,
    email: session.user.email,
    roleName: session.user.role.name,
  };
}

/**
 * Revoke one session.
 */
export async function revokeSession(sessionId: string) {
  const tokenHash = hashSessionId(sessionId);

  await prisma.session.updateMany({
    where: {
      tokenHash,
      revokedAt: null,
    },
    data: {
      revokedAt: new Date(),
    },
  });
}

/**
 * Revoke all sessions belonging to a user.
 */
export async function revokeAllUserSessions(userId: bigint) {
  await prisma.session.updateMany({
    where: {
      userId,
      revokedAt: null,
    },
    data: {
      revokedAt: new Date(),
    },
  });
}

/**
 * Rotate a session identifier.
 *
 * Creates a new session and revokes the old one
 * atomically.
 */
export async function rotateSession(sessionId: string) {
  const oldTokenHash = hashSessionId(sessionId);

  return prisma.$transaction(async (tx) => {
    const oldSession = await tx.session.findUnique({
      where: { tokenHash: oldTokenHash },
    });

    if (!oldSession) {
      throw new Error("Session not found.");
    }

    const now = new Date();

    if (
      oldSession.revokedAt ||
      oldSession.expiresAt <= now ||
      now.getTime() -
        (oldSession.lastUsedAt ?? oldSession.createdAt).getTime() >
        IDLE_TIMEOUT_MS
    ) {
      throw new Error("Session is no longer valid.");
    }

    const newSessionId = generateSessionId();
    const newTokenHash = hashSessionId(newSessionId);

    // Preserve the original absolute expiration.
    const newSession = await tx.session.create({
      data: {
        userId: oldSession.userId,
        tokenHash: newTokenHash,
        expiresAt: oldSession.expiresAt,
        lastUsedAt: now,
      },
    });

    await tx.session.update({
      where: { id: oldSession.id },
      data: { revokedAt: now },
    });

    return {
      sessionId: newSessionId,
      expiresAt: newSession.expiresAt,
    };
  });
}
