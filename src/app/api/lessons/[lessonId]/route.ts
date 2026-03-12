import { NextResponse } from "next/server";
import { getCatalogLessonById } from "@/data/catalog";

type Params = Promise<{ lessonId: string }>;

export async function GET(
  _request: Request,
  { params }: { params: Params }
) {
  const { lessonId } = await params;
  const lesson = await getCatalogLessonById(lessonId);

  if (!lesson) {
    return NextResponse.json(
      { error: "レッスンが見つかりません。" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    id: lesson.id,
    trackCode: lesson.track.code,
    trackName: lesson.track.name,
    slug: lesson.slug,
    title: lesson.title,
    summary: lesson.summary,
    estimatedMinutes: lesson.estimatedMinutes,
    content: lesson.content,
    sections: lesson.sections,
    href: `/learn/${lesson.track.code}/${lesson.slug}`,
  });
}
