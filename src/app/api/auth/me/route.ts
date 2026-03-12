import { NextResponse } from "next/server";
import { getAccountSnapshot } from "@/lib/account";
import { auth } from "@/lib/auth";

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

    const account = await getAccountSnapshot(session.user.id);

    if (!account) {
      return NextResponse.json(
        { error: "ユーザー情報が見つかりません。" },
        { status: 404, headers: noStoreHeaders }
      );
    }

    return NextResponse.json({
      id: account.userId,
      email: account.email,
      name: account.displayName,
      adminRole: account.adminRole,
      profile: {
        status: account.status,
        displayName: account.displayName,
        skillLevel: account.skillLevel,
        primaryGoal: account.primaryGoal,
        dailyMinutesGoal: account.dailyMinutesGoal,
        onboardingResult: account.onboardingResult,
      },
      preferences: account.preferences,
    }, { headers: noStoreHeaders });
  } catch (error) {
    console.error("Auth me error:", error);
    return NextResponse.json(
      { error: "ユーザー情報の取得中にエラーが発生しました。" },
      { status: 500, headers: noStoreHeaders }
    );
  }
}
