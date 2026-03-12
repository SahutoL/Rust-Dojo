import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getCatalogProblemById } from "@/data/catalog";
import { recordProblemExplanationViewed } from "@/data/learningService";

type Params = Promise<{ problemId: string }>;

export async function POST(
  _request: Request,
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

    await recordProblemExplanationViewed(session.user.id, problem.id);

    return NextResponse.json({
      ok: true,
      problemId: problem.id,
    });
  } catch (error) {
    console.error("Problem explanation viewed error:", error);
    return NextResponse.json(
      { error: "解説閲覧の記録に失敗しました。" },
      { status: 500 }
    );
  }
}
