import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function findUserForCredentials(email: string) {
  return prisma.user.findUnique({
    where: { email },
    include: { profile: true },
  });
}

export async function verifyCredentials(email: string, password: string) {
  const user = await findUserForCredentials(email);

  if (!user) {
    return { user: null, error: "INVALID_CREDENTIALS" as const };
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    return { user: null, error: "INVALID_CREDENTIALS" as const };
  }

  if (!user.emailVerifiedAt) {
    return { user, error: "EMAIL_NOT_VERIFIED" as const };
  }

  return { user, error: null };
}
