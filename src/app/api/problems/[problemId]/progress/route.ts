import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getCatalogProblemById } from "@/data/catalog";
import { ProgressState } from "@/lib/prisma";
import { recordProblemProgress } from "@/data/learningService";

type Params = Promise<{ problemId: string }>;

function parseProgressState(value: unknown) {
  return value === ProgressState.COMPLETED
    ? ProgressState.COMPLETED
    : ProgressState.IN_PROGRESS;
}

function parseScore(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, Math.min(100, Math.round(parsed))) : undefined;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: "ログインが必要です。" },
        { status: 401 }
      );
    }

    const { problemId } = await params;
    const problem = await getCatalogProblemById(problemId);

    if (!problem) {
      return NextResponse.json(
        { error: "問題が見つかりません。" },
        { status: 404 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const progressState = parseProgressState(body?.progressState);
    const score = parseScore(body?.score);

    await recordProblemProgress(
      session.user.id,
      problem.id,
      progressState,
      score
    );

    return NextResponse.json({
      ok: true,
      problemId: problem.id,
      progressState,
      score: score ?? null,
    });
  } catch (error) {
    console.error("Problem progress error:", error);
    return NextResponse.json(
      { error: "問題進捗の保存に失敗しました。" },
      { status: 500 }
    );
  }
}
