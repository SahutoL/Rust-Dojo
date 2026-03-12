import { NextResponse } from "next/server";
import { getAdminSnapshot } from "@/data/adminSnapshot";
import { canAccessAdmin } from "@/lib/admin";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: "ログインが必要です。" },
        { status: 401 }
      );
    }

    if (!canAccessAdmin(session.user.adminRole)) {
      return NextResponse.json(
        { error: "管理権限が必要です。" },
        { status: 403 }
      );
    }

    const snapshot = await getAdminSnapshot();
    return NextResponse.json(snapshot);
  } catch (error) {
    console.error("Admin analytics error:", error);
    return NextResponse.json(
      { error: "管理分析データの取得中にエラーが発生しました。" },
      { status: 500 }
    );
  }
}
