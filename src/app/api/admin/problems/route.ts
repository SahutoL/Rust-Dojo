import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { canAccessAdmin } from "@/lib/admin";
import { createProblemContent } from "@/lib/admin-content";
import { auth } from "@/lib/auth";
import { Difficulty, ProblemType } from "@/lib/prisma";

function parseBoolean(value: unknown) {
  return value === true || value === "true";
}

function parseTags(value: unknown) {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string");
  }

  if (typeof value === "string") {
    return value.split(",").map((item) => item.trim()).filter(Boolean);
  }

  return [];
}

function parseProblemType(value: unknown) {
  if (typeof value === "string" && value in ProblemType) {
    return value as ProblemType;
  }

  return ProblemType.IMPLEMENTATION;
}

function parseDifficulty(value: unknown) {
  if (typeof value === "string" && value in Difficulty) {
    return value as Difficulty;
  }

  return Difficulty.EASY;
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
    const problem = await createProblemContent(session.user.id, {
      trackCode:
        typeof body.trackCode === "string" ? body.trackCode : undefined,
      type: parseProblemType(body.type),
      title: String(body.title ?? ""),
      statement: String(body.statement ?? ""),
      difficulty: parseDifficulty(body.difficulty),
      estimatedMinutes: Number(body.estimatedMinutes ?? 10),
      constraintsText:
        typeof body.constraintsText === "string" ? body.constraintsText : null,
      inputFormat:
        typeof body.inputFormat === "string" ? body.inputFormat : null,
      outputFormat:
        typeof body.outputFormat === "string" ? body.outputFormat : null,
      hintText: typeof body.hintText === "string" ? body.hintText : null,
      explanationText:
        typeof body.explanationText === "string"
          ? body.explanationText
          : null,
      initialCode:
        typeof body.initialCode === "string" ? body.initialCode : null,
      isPublished: parseBoolean(body.isPublished),
      tags: parseTags(body.tags),
      relatedLessonIds: Array.isArray(body.relatedLessonIds)
        ? body.relatedLessonIds.filter(
            (item: unknown): item is string => typeof item === "string"
          )
        : [],
    });

    revalidatePath("/");
    revalidatePath("/exercises");
    revalidatePath(`/exercises/${problem.id}`);
    revalidatePath("/dashboard");
    revalidatePath("/admin");

    return NextResponse.json({ ok: true, problemId: problem.id }, { status: 201 });
  } catch (error) {
    console.error("Admin problem create error:", error);
    return NextResponse.json(
      { error: "問題の作成に失敗しました。" },
      { status: 500 }
    );
  }
}
