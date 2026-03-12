import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getLearningSnapshotForUser } from "@/data/learningService";

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store",
} as const;

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: "ログインが必要です。" },
        { status: 401, headers: NO_STORE_HEADERS }
      );
    }

    const snapshot = await getLearningSnapshotForUser(session.user.id);

    if (!snapshot) {
      return NextResponse.json(
        { error: "学習データが見つかりません。" },
        { status: 404, headers: NO_STORE_HEADERS }
      );
    }

    return NextResponse.json(snapshot, {
      headers: NO_STORE_HEADERS,
    });
  } catch (error) {
    console.error("Learning snapshot error:", error);
    return NextResponse.json(
      { error: "学習データの取得に失敗しました。" },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}
