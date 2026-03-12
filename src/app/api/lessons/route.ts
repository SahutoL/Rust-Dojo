import { NextRequest, NextResponse } from "next/server";
import { tracks } from "@/data/lessons";

export async function GET(request: NextRequest) {
  const trackCode = request.nextUrl.searchParams.get("track");
  const lessonRows = tracks.flatMap((track) =>
    track.lessons.map((lesson) => ({
      id: `${track.code}/${lesson.slug}`,
      trackCode: track.code,
      trackName: track.name,
      slug: lesson.slug,
      title: lesson.title,
      summary: lesson.summary,
      estimatedMinutes: lesson.estimatedMinutes,
      isPublished: track.availability === "available",
      href: `/learn/${track.code}/${lesson.slug}`,
    }))
  );

  return NextResponse.json({
    lessons: trackCode
      ? lessonRows.filter((lesson) => lesson.trackCode === trackCode)
      : lessonRows,
  });
}
