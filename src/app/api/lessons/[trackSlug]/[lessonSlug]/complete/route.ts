import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getCatalogLessonByTrackAndSlug } from "@/data/catalog";
import { ProgressState } from "@/lib/prisma";
import {
  getLessonSectionProgressForUser,
  recordLessonProgress,
} from "@/data/learningService";

type Params = Promise<{ trackSlug: string; lessonSlug: string }>;

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

    const { trackSlug, lessonSlug } = await params;
    const lesson = await getCatalogLessonByTrackAndSlug(trackSlug, lessonSlug);

    if (!lesson) {
      return NextResponse.json(
        { error: "レッスンが見つかりません。" },
        { status: 404 }
      );
    }

    await recordLessonProgress(
      session.user.id,
      lesson.track.code,
      lesson.id,
      lesson.slug,
      ProgressState.COMPLETED
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
      progressState: ProgressState.COMPLETED,
      summary,
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "LESSON_COMPLETE_REQUIREMENTS_NOT_MET"
    ) {
      return NextResponse.json(
        { error: "完了条件をまだ満たしていません。" },
        { status: 409 }
      );
    }
    console.error("Lesson complete error:", error);
    return NextResponse.json(
      { error: "レッスン完了の保存に失敗しました。" },
      { status: 500 }
    );
  }
}
