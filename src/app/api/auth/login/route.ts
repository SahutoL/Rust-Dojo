import { NextRequest, NextResponse } from "next/server";
import { verifyCredentials } from "@/lib/auth-credentials";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const email = typeof body?.email === "string" ? body.email.trim() : "";
    const password = typeof body?.password === "string" ? body.password : "";

    if (!email || !password) {
      return NextResponse.json(
        { error: "メールアドレスとパスワードは必須です。" },
        { status: 400 }
      );
    }

    const result = await verifyCredentials(email, password);

    if (result.error === "EMAIL_NOT_VERIFIED") {
      return NextResponse.json(
        { error: "メール確認が完了していません。", code: "EMAIL_NOT_VERIFIED" },
        { status: 403 }
      );
    }

    if (result.error || !result.user) {
      return NextResponse.json(
        { error: "メールアドレスまたはパスワードが正しくありません。" },
        { status: 401 }
      );
    }

    return NextResponse.json({
      ok: true,
      id: result.user.id,
      email: result.user.email,
    });
  } catch (error) {
    console.error("Login validation error:", error);
    return NextResponse.json(
      { error: "ログイン処理中にエラーが発生しました。" },
      { status: 500 }
    );
  }
}
