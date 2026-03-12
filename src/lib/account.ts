import { SessionAdminRole } from "@/lib/admin";
import {
  PrimaryGoal,
  SkillLevel,
  UserStatus,
  prisma,
} from "@/lib/prisma";
import {
  DEFAULT_ACCOUNT_PREFERENCES,
  parseAccountPreferences,
  type AccountPreferences,
} from "@/lib/account-preferences";
import {
  parseStoredOnboardingResult,
  type StoredOnboardingResult,
} from "@/lib/onboarding";

export interface AccountSnapshot {
  userId: string;
  email: string;
  status: UserStatus;
  displayName: string;
  skillLevel: SkillLevel;
  primaryGoal: PrimaryGoal;
  dailyMinutesGoal: number;
  onboardingResult: StoredOnboardingResult | null;
  preferences: AccountPreferences;
  adminRole: SessionAdminRole | null;
}

export const primaryGoalLabel: Record<PrimaryGoal, string> = {
  PROGRAMMING_BASICS: "プログラミング基礎",
  RUST_INTRO: "Rust 入門",
  RUST_PRACTICAL: "Rust 実務",
  ATCODER: "AtCoder",
  OSS: "OSS 参加",
  CAREER: "就職・転職",
};

export const skillLevelLabel: Record<SkillLevel, string> = {
  BEGINNER: "未経験",
  ELEMENTARY: "初学",
  INTERMEDIATE: "基本文法済み",
  ADVANCED: "中級以上",
};

export function buildDisplayName(email: string, displayName?: string | null) {
  const normalized = displayName?.trim();
  return normalized && normalized.length > 0 ? normalized : email.split("@")[0];
}

export async function getSessionIdentityForUser(userId: string): Promise<{
  displayName: string;
  adminRole: SessionAdminRole | null;
} | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      email: true,
      profile: {
        select: { displayName: true },
      },
    },
  });

  if (!user) {
    return null;
  }

  const adminUser = await prisma.adminUser.findUnique({
    where: { userId },
    select: { role: true },
  });

  return {
    displayName: buildDisplayName(user.email, user.profile?.displayName),
    adminRole: adminUser?.role ?? null,
  };
}

export async function getAccountSnapshot(
  userId: string
): Promise<AccountSnapshot | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      status: true,
      profile: {
        select: {
          displayName: true,
          skillLevel: true,
          primaryGoal: true,
          dailyMinutesGoal: true,
          onboardingResult: true,
          preferencesJson: true,
        },
      },
    },
  });

  if (!user) {
    return null;
  }

  const adminUser = await prisma.adminUser.findUnique({
    where: { userId },
    select: { role: true },
  });

  return {
    userId: user.id,
    email: user.email,
    status: user.status,
    displayName: buildDisplayName(user.email, user.profile?.displayName),
    skillLevel: user.profile?.skillLevel ?? SkillLevel.BEGINNER,
    primaryGoal: user.profile?.primaryGoal ?? PrimaryGoal.RUST_INTRO,
    dailyMinutesGoal: user.profile?.dailyMinutesGoal ?? 30,
    onboardingResult: parseStoredOnboardingResult(user.profile?.onboardingResult),
    preferences: user.profile
      ? parseAccountPreferences(user.profile.preferencesJson)
      : DEFAULT_ACCOUNT_PREFERENCES,
    adminRole: adminUser?.role ?? null,
  };
}
