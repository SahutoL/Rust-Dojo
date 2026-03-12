import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { canAccessAdmin } from "@/lib/admin";
import { auth } from "@/lib/auth";
import { createLessonContent } from "@/lib/admin-content";

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
    const lesson = await createLessonContent(session.user.id, {
      trackCode: String(body.trackCode ?? ""),
      slug: String(body.slug ?? ""),
      title: String(body.title ?? ""),
      summary: typeof body.summary === "string" ? body.summary : null,
      estimatedMinutes: Number(body.estimatedMinutes ?? 10),
      content: typeof body.content === "string" ? body.content : "",
      isPublished: parseBoolean(body.isPublished),
      tags: parseTags(body.tags),
    });

    revalidatePath("/");
    revalidatePath("/learn");
    revalidatePath(`/learn/${lesson.track.code}`);
    revalidatePath(`/learn/${lesson.track.code}/${lesson.slug}`);
    revalidatePath("/admin");

    return NextResponse.json({ ok: true, lessonId: lesson.id }, { status: 201 });
  } catch (error) {
    console.error("Admin lesson create error:", error);
    return NextResponse.json(
      { error: "レッスンの作成に失敗しました。" },
      { status: 500 }
    );
  }
}
