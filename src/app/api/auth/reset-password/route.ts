import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import {
  consumePasswordResetToken,
  createPasswordResetToken,
} from "@/lib/auth-tokens";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const mode = body?.mode;

    if (mode === "request") {
      const email = typeof body?.email === "string" ? body.email.trim() : "";

      if (!email) {
        return NextResponse.json(
          { error: "メールアドレスは必須です。" },
          { status: 400 }
        );
      }

      const user = await prisma.user.findUnique({
        where: { email },
        select: { id: true },
      });

      if (!user) {
        return NextResponse.json(
          { error: "該当するユーザーが見つかりません。" },
          { status: 404 }
        );
      }

      const resetTokenPreview = await createPasswordResetToken(user.id);

      return NextResponse.json({
        ok: true,
        ...(process.env.NODE_ENV !== "production"
          ? { resetTokenPreview }
          : {}),
      });
    }

    if (mode === "confirm") {
      const token = typeof body?.token === "string" ? body.token.trim() : "";
      const password = typeof body?.password === "string" ? body.password : "";

      if (!token || password.length < 8) {
        return NextResponse.json(
          { error: "token と 8 文字以上の password が必要です。" },
          { status: 400 }
        );
      }

      const tokenRow = await consumePasswordResetToken(token);

      if (!tokenRow) {
        return NextResponse.json(
          { error: "再設定トークンが無効か、期限切れです。" },
          { status: 400 }
        );
      }

      const passwordHash = await bcrypt.hash(password, 12);
      await prisma.user.update({
        where: { id: tokenRow.userId },
        data: {
          passwordHash,
        },
      });

      return NextResponse.json({ ok: true });
    }

    return NextResponse.json(
      { error: "mode は request または confirm を指定してください。" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { error: "パスワード再設定処理中にエラーが発生しました。" },
      { status: 500 }
    );
  }
}
