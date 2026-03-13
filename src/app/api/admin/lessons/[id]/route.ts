import { revalidatePath, revalidateTag } from "next/cache";
import type { InputJsonValue } from "@prisma/client/runtime/client";
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
import { SectionType } from "@/lib/prisma";

type Params = Promise<{ id: string }>;

function parseBoolean(value: unknown) {
  return value === true || value === "true";
}

function hasOwn(value: unknown, key: string) {
  return typeof value === "object" && value !== null && key in value;
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

function parseSectionType(value: unknown) {
  if (typeof value !== "string" || !(value in SectionType)) {
    return null;
  }

  return value as SectionType;
}

function parseSections(value: unknown) {
  if (!Array.isArray(value)) {
    return undefined;
  }

  return value.flatMap((item) => {
    if (typeof item !== "object" || item === null) {
      return [];
    }

    const sectionType = parseSectionType(item.sectionType);
    const content =
      typeof item.content === "string" ? item.content : null;

    if (!sectionType || content === null) {
      return [];
    }

    return [
      {
        sectionType,
        title: typeof item.title === "string" ? item.title : null,
        content,
        isRequired:
          typeof item.isRequired === "boolean" ? item.isRequired : undefined,
        payloadJson: (item.payloadJson ?? null) as InputJsonValue | null,
      },
    ];
  });
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
      tags: hasOwn(body, "tags") ? parseTags(body.tags) : undefined,
      sections: hasOwn(body, "sections") ? parseSections(body.sections) : undefined,
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
