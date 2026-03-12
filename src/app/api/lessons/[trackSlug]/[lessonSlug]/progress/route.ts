import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getCatalogLessonByTrackAndSlug } from "@/data/catalog";
import { ProgressState } from "@/lib/prisma";
import {
  getLessonSectionProgressForUser,
  recordLessonProgress,
  recordLessonSectionProgress,
} from "@/data/learningService";

type Params = Promise<{ trackSlug: string; lessonSlug: string }>;

function parseProgressState(value: unknown) {
  return value === ProgressState.COMPLETED
    ? ProgressState.COMPLETED
    : ProgressState.IN_PROGRESS;
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

    const { trackSlug, lessonSlug } = await params;
    const lesson = await getCatalogLessonByTrackAndSlug(trackSlug, lessonSlug);

    if (!lesson) {
      return NextResponse.json(
        { error: "レッスンが見つかりません。" },
        { status: 404 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const progressState = parseProgressState(body?.progressState);
    const sectionId =
      typeof body?.sectionId === "string" ? body.sectionId : null;
    const sectionStatus = parseProgressState(body?.status);

    if (sectionId) {
      const summary = await recordLessonSectionProgress({
        userId: session.user.id,
        lessonId: lesson.id,
        sectionId,
        status: sectionStatus,
        payloadJson: body?.payloadJson ?? null,
      });

      return NextResponse.json({
        ok: true,
        trackCode: lesson.track.code,
        lessonId: lesson.id,
        lessonSlug: lesson.slug,
        summary,
      });
    }

    await recordLessonProgress(
      session.user.id,
      lesson.track.code,
      lesson.id,
      lesson.slug,
      progressState
    );
    const summary = await getLessonSectionProgressForUser(
      session.user.id,
      lesson.id
    );

    return NextResponse.json({
      ok: true,
      trackCode: lesson.track.code,
      lessonId: lesson.id,
      lessonSlug: lesson.slug,
      progressState,
      summary,
    });
  } catch (error) {
    console.error("Lesson progress error:", error);
    return NextResponse.json(
      { error: "レッスン進捗の保存に失敗しました。" },
      { status: 500 }
    );
  }
}
