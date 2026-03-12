import { NextRequest, NextResponse } from "next/server";
import { getCatalogLessons } from "@/data/catalog";

export async function GET(request: NextRequest) {
  const trackCode = request.nextUrl.searchParams.get("track");
  const q = request.nextUrl.searchParams.get("q");
  const lessonRows = await getCatalogLessons({
    trackCode: trackCode || undefined,
    q: q || undefined,
  });

  return NextResponse.json({
    lessons: lessonRows.map((lesson) => ({
      id: lesson.id,
      trackCode: lesson.trackCode,
      trackName: lesson.trackName,
      slug: lesson.slug,
      title: lesson.title,
      summary: lesson.summary,
      estimatedMinutes: lesson.estimatedMinutes,
      isPublished: true,
      href: `/learn/${lesson.trackCode}/${lesson.slug}`,
    })),
  });
}
