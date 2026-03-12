import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { canAccessAdmin } from "@/lib/admin";
import { createProblemTestcase } from "@/lib/admin-content";
import { auth } from "@/lib/auth";
import { CaseType } from "@/lib/prisma";

function parseCaseType(value: unknown) {
  return value === CaseType.HIDDEN ? CaseType.HIDDEN : CaseType.SAMPLE;
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "ログインが必要です。" }, { status: 401 });
    }

    if (!canAccessAdmin(session.user.adminRole)) {
      return NextResponse.json({ error: "権限がありません。" }, { status: 403 });
    }

    const body = await request.json();
    const testcase = await createProblemTestcase(session.user.id, {
      problemId: String(body.problemId ?? ""),
      caseType: parseCaseType(body.caseType),
      inputText: String(body.inputText ?? ""),
      expectedOutputText: String(body.expectedOutputText ?? ""),
      timeLimitMs: Number(body.timeLimitMs ?? 2000),
      memoryLimitKb: Number(body.memoryLimitKb ?? 262144),
      score: Number(body.score ?? 0),
    });

    revalidatePath("/exercises");
    revalidatePath(`/exercises/${testcase.problemId}`);
    revalidatePath("/admin");

    return NextResponse.json({ ok: true, testcaseId: testcase.id }, { status: 201 });
  } catch (error) {
    console.error("Admin testcase create error:", error);
    return NextResponse.json(
      { error: "テストケースの作成に失敗しました。" },
      { status: 500 }
    );
  }
}
