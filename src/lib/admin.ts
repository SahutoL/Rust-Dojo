import { AdminRole, prisma } from "@/lib/prisma";

export const ADMIN_ROLES = [AdminRole.ADMIN, AdminRole.EDITOR] as const;

export type SessionAdminRole = (typeof ADMIN_ROLES)[number];

export function isSessionAdminRole(
  value: unknown
): value is SessionAdminRole {
  return value === AdminRole.ADMIN || value === AdminRole.EDITOR;
}

export function canAccessAdmin(
  role: SessionAdminRole | null | undefined
): role is SessionAdminRole {
  return role === AdminRole.ADMIN || role === AdminRole.EDITOR;
}

export async function getAdminRoleForUser(
  userId: string
): Promise<SessionAdminRole | null> {
  const adminUser = await prisma.adminUser.findUnique({
    where: { userId },
    select: { role: true },
  });

  return adminUser?.role ?? null;
}
