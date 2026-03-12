import { NextRequest, NextResponse } from "next/server";
import { createEmailVerificationToken, consumeEmailVerificationToken } from "@/lib/auth-tokens";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const token = typeof body?.token === "string" ? body.token.trim() : "";
    const email = typeof body?.email === "string" ? body.email.trim() : "";

    if (token) {
      const userId = await consumeEmailVerificationToken(token);

      if (!userId) {
        return NextResponse.json(
          { error: "確認トークンが無効か、期限切れです。" },
          { status: 400 }
        );
      }

      return NextResponse.json({ ok: true, userId });
    }

    if (!email) {
      return NextResponse.json(
        { error: "token か email のいずれかが必要です。" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        emailVerifiedAt: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "該当するユーザーが見つかりません。" },
        { status: 404 }
      );
    }

    if (user.emailVerifiedAt) {
      return NextResponse.json({ ok: true, alreadyVerified: true });
    }

    const verificationTokenPreview = await createEmailVerificationToken(user.id);

    return NextResponse.json({
      ok: true,
      ...(process.env.NODE_ENV !== "production"
        ? { verificationTokenPreview }
        : {}),
    });
  } catch (error) {
    console.error("Email verification error:", error);
    return NextResponse.json(
      { error: "メール確認処理中にエラーが発生しました。" },
      { status: 500 }
    );
  }
}
