import { NextResponse } from "next/server";
import { signOut } from "@/lib/auth";

export async function POST() {
  try {
    await signOut({
      redirect: false,
      redirectTo: "/",
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json(
      { error: "ログアウト処理中にエラーが発生しました。" },
      { status: 500 }
    );
  }
}
