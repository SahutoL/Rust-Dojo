import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseStoredOnboardingResult } from "@/lib/onboarding";

const noStoreHeaders = {
  "Cache-Control": "no-store",
} as const;

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: "ログインが必要です。" },
        { status: 401, headers: noStoreHeaders }
      );
    }

    const profile = await prisma.userProfile.findUnique({
      where: { userId: session.user.id },
      select: {
        primaryGoal: true,
        skillLevel: true,
        onboardingResult: true,
      },
    });

    const onboardingResult = parseStoredOnboardingResult(
      profile?.onboardingResult
    );

    if (!profile || !onboardingResult) {
      return NextResponse.json(
        { error: "保存済みの診断結果はありません。" },
        { status: 404, headers: noStoreHeaders }
      );
    }

    return NextResponse.json({
      primaryGoal: profile.primaryGoal,
      skillLevel: profile.skillLevel,
      onboardingResult,
    }, { headers: noStoreHeaders });
  } catch (error) {
    console.error("Onboarding result error:", error);
    return NextResponse.json(
      { error: "診断結果の取得中にエラーが発生しました。" },
      { status: 500, headers: noStoreHeaders }
    );
  }
}
