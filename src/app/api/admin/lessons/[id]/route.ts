import { revalidatePath, revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { canAccessAdmin } from "@/lib/admin";
import { auth } from "@/lib/auth";
import { updateLessonContent } from "@/lib/admin-content";
import {
  CATALOG_LESSONS_TAG,
  CATALOG_TRACKS_TAG,
  getCatalogLessonTag,
  getCatalogTrackTag,
} from "@/data/catalog";

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
    const lesson = await updateLessonContent(session.user.id, id, {
      trackCode:
        typeof body.trackCode === "string" ? body.trackCode : undefined,
      slug: typeof body.slug === "string" ? body.slug : undefined,
      title: typeof body.title === "string" ? body.title : undefined,
      summary: typeof body.summary === "string" ? body.summary : undefined,
      estimatedMinutes:
        typeof body.estimatedMinutes === "undefined"
          ? undefined
          : Number(body.estimatedMinutes),
      content: typeof body.content === "string" ? body.content : undefined,
      isPublished:
        typeof body.isPublished === "undefined"
          ? undefined
          : parseBoolean(body.isPublished),
      tags: parseTags(body.tags),
    });

    revalidatePath("/");
    revalidatePath("/learn");
    revalidatePath(`/learn/${lesson.track.code}`);
    revalidatePath(`/learn/${lesson.track.code}/${lesson.slug}`);
    revalidatePath("/admin");
    revalidateTag(CATALOG_TRACKS_TAG, "max");
    revalidateTag(CATALOG_LESSONS_TAG, "max");
    revalidateTag(getCatalogTrackTag(lesson.track.code), "max");
    revalidateTag(getCatalogLessonTag(lesson.track.code, lesson.slug), "max");

    return NextResponse.json({ ok: true, lessonId: lesson.id });
  } catch (error) {
    console.error("Admin lesson update error:", error);
    return NextResponse.json(
      { error: "レッスンの更新に失敗しました。" },
      { status: 500 }
    );
  }
}
