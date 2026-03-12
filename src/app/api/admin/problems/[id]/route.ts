import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { canAccessAdmin } from "@/lib/admin";
import { updateProblemContent } from "@/lib/admin-content";
import { auth } from "@/lib/auth";
import { Difficulty, ProblemType } from "@/lib/prisma";

type Params = Promise<{ id: string }>;

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

  return undefined;
}

function parseDifficulty(value: unknown) {
  if (typeof value === "string" && value in Difficulty) {
    return value as Difficulty;
  }

  return undefined;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "ログインが必要です。" }, { status: 401 });
    }

    if (!canAccessAdmin(session.user.adminRole)) {
      return NextResponse.json({ error: "権限がありません。" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const problem = await updateProblemContent(session.user.id, id, {
      trackCode:
        typeof body.trackCode === "string" ? body.trackCode : undefined,
      type: parseProblemType(body.type),
      title: typeof body.title === "string" ? body.title : undefined,
      statement:
        typeof body.statement === "string" ? body.statement : undefined,
      difficulty: parseDifficulty(body.difficulty),
      estimatedMinutes:
        typeof body.estimatedMinutes === "undefined"
          ? undefined
          : Number(body.estimatedMinutes),
      constraintsText:
        typeof body.constraintsText === "string" ? body.constraintsText : undefined,
      inputFormat:
        typeof body.inputFormat === "string" ? body.inputFormat : undefined,
      outputFormat:
        typeof body.outputFormat === "string" ? body.outputFormat : undefined,
      hintText: typeof body.hintText === "string" ? body.hintText : undefined,
      explanationText:
        typeof body.explanationText === "string"
          ? body.explanationText
          : undefined,
      initialCode:
        typeof body.initialCode === "string" ? body.initialCode : undefined,
      isPublished:
        typeof body.isPublished === "undefined"
          ? undefined
          : parseBoolean(body.isPublished),
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

    return NextResponse.json({ ok: true, problemId: problem.id });
  } catch (error) {
    console.error("Admin problem update error:", error);
    return NextResponse.json(
      { error: "問題の更新に失敗しました。" },
      { status: 500 }
    );
  }
}
