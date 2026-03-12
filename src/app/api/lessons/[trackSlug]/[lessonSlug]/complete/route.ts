import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getLesson, getTrack } from "@/data/lessons";
import { ProgressState } from "@/lib/prisma";
import { recordLessonProgress } from "@/data/learningService";

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
    const track = getTrack(trackSlug);
    const lesson = getLesson(trackSlug, lessonSlug);

    if (!track || !lesson) {
      return NextResponse.json(
        { error: "レッスンが見つかりません。" },
        { status: 404 }
      );
    }

    await recordLessonProgress(
      session.user.id,
      track.code,
      lesson.slug,
      ProgressState.COMPLETED
    );

    return NextResponse.json({
      ok: true,
      trackCode: track.code,
      lessonSlug: lesson.slug,
      progressState: ProgressState.COMPLETED,
    });
  } catch (error) {
    console.error("Lesson complete error:", error);
    return NextResponse.json(
      { error: "レッスン完了の保存に失敗しました。" },
      { status: 500 }
    );
  }
}
