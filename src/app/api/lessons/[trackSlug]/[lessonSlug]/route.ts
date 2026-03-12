import { NextResponse } from "next/server";
import { getLesson, getTrack } from "@/data/lessons";

type Params = Promise<{ trackSlug: string; lessonSlug: string }>;

export async function GET(
  _request: Request,
  { params }: { params: Params }
) {
  const { trackSlug, lessonSlug } = await params;
  const track = getTrack(trackSlug);
  const lesson = getLesson(trackSlug, lessonSlug);

  if (!track || !lesson) {
    return NextResponse.json(
      { error: "レッスンが見つかりません。" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    id: `${track.code}/${lesson.slug}`,
    trackCode: track.code,
    trackName: track.name,
    slug: lesson.slug,
    title: lesson.title,
    summary: lesson.summary,
    estimatedMinutes: lesson.estimatedMinutes,
    content: lesson.content,
    isPublished: track.availability === "available",
    href: `/learn/${track.code}/${lesson.slug}`,
  });
}
