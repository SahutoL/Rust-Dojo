import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getLesson, getTrack } from "@/data/lessons";
import { ProgressState } from "@/lib/prisma";
import { recordLessonProgress } from "@/data/learningService";

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
    const track = getTrack(trackSlug);
    const lesson = getLesson(trackSlug, lessonSlug);

    if (!track || !lesson) {
      return NextResponse.json(
        { error: "レッスンが見つかりません。" },
        { status: 404 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const progressState = parseProgressState(body?.progressState);

    await recordLessonProgress(
      session.user.id,
      track.code,
      lesson.slug,
      progressState
    );

    return NextResponse.json({
      ok: true,
      trackCode: track.code,
      lessonSlug: lesson.slug,
      progressState,
    });
  } catch (error) {
    console.error("Lesson progress error:", error);
    return NextResponse.json(
      { error: "レッスン進捗の保存に失敗しました。" },
      { status: 500 }
    );
  }
}
