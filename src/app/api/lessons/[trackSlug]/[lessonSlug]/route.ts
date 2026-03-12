import { NextResponse } from "next/server";
import { getCatalogLessonByTrackAndSlug } from "@/data/catalog";

type Params = Promise<{ trackSlug: string; lessonSlug: string }>;

export async function GET(
  _request: Request,
  { params }: { params: Params }
) {
  const { trackSlug, lessonSlug } = await params;
  const lesson = await getCatalogLessonByTrackAndSlug(trackSlug, lessonSlug);

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
    isPublished: lesson.track.availability === "available",
    href: `/learn/${lesson.track.code}/${lesson.slug}`,
    sections: lesson.sections,
  });
}
