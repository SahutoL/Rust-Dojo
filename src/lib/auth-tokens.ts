import crypto from "node:crypto";
import { prisma } from "@/lib/prisma";

const EMAIL_VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000;
const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000;

function buildToken() {
  return crypto.randomBytes(24).toString("hex");
}

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function createEmailVerificationToken(userId: string) {
  const token = buildToken();
  const tokenHash = hashToken(token);

  await prisma.emailVerificationToken.create({
    data: {
      userId,
      tokenHash,
      expiresAt: new Date(Date.now() + EMAIL_VERIFICATION_TTL_MS),
    },
  });

  return token;
}

export async function consumeEmailVerificationToken(token: string) {
  const tokenHash = hashToken(token);
  const row = await prisma.emailVerificationToken.findFirst({
    where: {
      tokenHash,
      usedAt: null,
    },
    select: {
      id: true,
      userId: true,
      expiresAt: true,
    },
  });

  if (!row || row.expiresAt.getTime() < Date.now()) {
    return null;
  }

  await prisma.$transaction([
    prisma.emailVerificationToken.update({
      where: { id: row.id },
      data: {
        usedAt: new Date(),
      },
    }),
    prisma.user.update({
      where: { id: row.userId },
      data: {
        emailVerifiedAt: new Date(),
      },
    }),
  ]);

  return row.userId;
}

export async function createPasswordResetToken(userId: string) {
  const token = buildToken();
  const tokenHash = hashToken(token);

  await prisma.passwordResetToken.create({
    data: {
      userId,
      tokenHash,
      expiresAt: new Date(Date.now() + PASSWORD_RESET_TTL_MS),
    },
  });

  return token;
}

export async function consumePasswordResetToken(token: string) {
  const tokenHash = hashToken(token);
  return prisma.$transaction(async (tx) => {
    const row = await tx.passwordResetToken.findFirst({
      where: {
        tokenHash,
        usedAt: null,
      },
      select: {
        id: true,
        userId: true,
        expiresAt: true,
      },
    });

    if (!row || row.expiresAt.getTime() < Date.now()) {
      return null;
    }

    const updateResult = await tx.passwordResetToken.updateMany({
      where: {
        id: row.id,
        usedAt: null,
      },
      data: {
        usedAt: new Date(),
      },
    });

    if (updateResult.count !== 1) {
      return null;
    }

    return row;
  });
}
