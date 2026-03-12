import { NextRequest, NextResponse } from "next/server";
import { runProblemCode } from "@/lib/problem-attempts";

type Params = Promise<{ problemId: string }>;

export async function POST(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const body = await request.json();
    const { code } = body;

    if (!code || typeof code !== "string") {
      return NextResponse.json(
        { error: "code は必須です。" },
        { status: 400 }
      );
    }

    const { problemId } = await params;
    const result = await runProblemCode(problemId, code);

    if (!result) {
      return NextResponse.json(
        { error: "問題が見つかりません。" },
        { status: 404 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Problem run error:", error);
    return NextResponse.json(
      { error: "実行中にエラーが発生しました。" },
      { status: 500 }
    );
  }
}
