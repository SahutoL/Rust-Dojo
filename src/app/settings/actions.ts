"use server";

import type { InputJsonValue } from "@prisma/client/runtime/client";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  DEFAULT_ACCOUNT_PREFERENCES,
  EDITOR_FONT_SIZE_COOKIE_NAME,
  THEME_COOKIE_NAME,
  parseEditorFontSize,
  parseThemePreference,
  serializeAccountPreferences,
} from "@/lib/account-preferences";
import { auth } from "@/lib/auth";
import { PrimaryGoal, prisma } from "@/lib/prisma";

const allowedPrimaryGoals = new Set<PrimaryGoal>([
  PrimaryGoal.PROGRAMMING_BASICS,
  PrimaryGoal.RUST_INTRO,
  PrimaryGoal.RUST_PRACTICAL,
  PrimaryGoal.ATCODER,
  PrimaryGoal.OSS,
  PrimaryGoal.CAREER,
]);

function normalizeDisplayName(value: FormDataEntryValue | null) {
  const text = typeof value === "string" ? value.trim() : "";
  return text.length > 0 ? text.slice(0, 50) : null;
}

function normalizeDailyMinutesGoal(value: FormDataEntryValue | null) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return 30;
  }

  return Math.min(600, Math.max(1, Math.round(parsed)));
}

function normalizePrimaryGoal(value: FormDataEntryValue | null) {
  if (
    typeof value === "string" &&
    allowedPrimaryGoals.has(value as PrimaryGoal)
  ) {
    return value as PrimaryGoal;
  }

  return PrimaryGoal.RUST_INTRO;
}

function readCheckbox(formData: FormData, name: string) {
  return formData.get(name) === "on";
}

export async function saveSettingsAction(formData: FormData) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login?callbackUrl=/settings");
  }

  const preferences = {
    theme: parseThemePreference(formData.get("theme")),
    editorFontSize: parseEditorFontSize(formData.get("editorFontSize")),
    studyReminderEnabled: readCheckbox(formData, "studyReminderEnabled"),
    reviewReminderEnabled: readCheckbox(formData, "reviewReminderEnabled"),
    newContentNotificationEnabled: readCheckbox(
      formData,
      "newContentNotificationEnabled"
    ),
    usageAnalyticsEnabled: readCheckbox(formData, "usageAnalyticsEnabled"),
  };
  const preferencesJson = serializeAccountPreferences({
    ...DEFAULT_ACCOUNT_PREFERENCES,
    ...preferences,
  }) as InputJsonValue;

  await prisma.userProfile.upsert({
    where: { userId: session.user.id },
    update: {
      displayName: normalizeDisplayName(formData.get("displayName")),
      primaryGoal: normalizePrimaryGoal(formData.get("primaryGoal")),
      dailyMinutesGoal: normalizeDailyMinutesGoal(formData.get("dailyMinutesGoal")),
      preferencesJson,
    },
    create: {
      userId: session.user.id,
      displayName: normalizeDisplayName(formData.get("displayName")),
      primaryGoal: normalizePrimaryGoal(formData.get("primaryGoal")),
      dailyMinutesGoal: normalizeDailyMinutesGoal(formData.get("dailyMinutesGoal")),
      preferencesJson,
    },
  });

  const cookieStore = await cookies();
  cookieStore.set(THEME_COOKIE_NAME, preferences.theme, {
    path: "/",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
  });
  cookieStore.set(
    EDITOR_FONT_SIZE_COOKIE_NAME,
    String(preferences.editorFontSize),
    {
      path: "/",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365,
    }
  );

  revalidatePath("/profile");
  revalidatePath("/settings");
  revalidatePath("/dashboard");
  revalidatePath("/review");

  redirect("/settings?updated=1");
}
