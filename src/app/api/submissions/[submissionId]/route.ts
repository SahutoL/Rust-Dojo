import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store",
} as const;

type Params = Promise<{ submissionId: string }>;

export async function GET(
  _request: Request,
  { params }: { params: Params }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: "ログインが必要です。" },
        { status: 401, headers: NO_STORE_HEADERS }
      );
    }

    const { submissionId } = await params;
    const submission = await prisma.submission.findFirst({
      where: {
        id: submissionId,
        userId: session.user.id,
      },
      select: {
        id: true,
        problemId: true,
        language: true,
        status: true,
        totalTimeMs: true,
        totalMemoryKb: true,
        score: true,
        compileOutput: true,
        submittedAt: true,
      },
    });

    if (!submission) {
      return NextResponse.json(
        { error: "提出が見つかりません。" },
        { status: 404, headers: NO_STORE_HEADERS }
      );
    }

    return NextResponse.json(submission, {
      headers: NO_STORE_HEADERS,
    });
  } catch (error) {
    console.error("Submission detail error:", error);
    return NextResponse.json(
      { error: "提出詳細の取得に失敗しました。" },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}
